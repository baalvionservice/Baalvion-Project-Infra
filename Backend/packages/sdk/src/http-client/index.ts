import type {
  HttpClient,
  HttpClientOptions,
  HttpRequestOptions,
  HttpResponse,
  CircuitBreakerOptions,
  FetchLike,
} from '../types';

const IDEMPOTENT = new Set(['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']);

type CbState = 'closed' | 'open' | 'half';

/** Per-host circuit breaker: trip open after repeated failures, probe to recover. */
class Breaker {
  private hosts = new Map<string, { state: CbState; failures: number; openedAt: number; halfInflight: number }>();
  constructor(private readonly o: Required<CircuitBreakerOptions>) {}

  private slot(host: string) {
    let s = this.hosts.get(host);
    if (!s) { s = { state: 'closed', failures: 0, openedAt: 0, halfInflight: 0 }; this.hosts.set(host, s); }
    return s;
  }
  canRequest(host: string): boolean {
    const s = this.slot(host);
    if (s.state === 'open') {
      if (Date.now() - s.openedAt >= this.o.resetTimeoutMs) { s.state = 'half'; s.halfInflight = 0; }
      else return false;
    }
    if (s.state === 'half') {
      if (s.halfInflight >= this.o.halfOpenMax) return false;
      s.halfInflight += 1;
    }
    return true;
  }
  onSuccess(host: string) {
    const s = this.slot(host);
    s.failures = 0; s.state = 'closed'; s.halfInflight = 0;
  }
  onFailure(host: string) {
    const s = this.slot(host);
    s.failures += 1; s.halfInflight = Math.max(0, s.halfInflight - 1);
    if (s.state === 'half' || s.failures >= this.o.failureThreshold) { s.state = 'open'; s.openedAt = Date.now(); }
  }
  stateOf(host: string): CbState { return this.slot(host).state; }
}

export class CircuitOpenError extends Error {
  constructor(host: string) { super(`circuit open for ${host}`); this.name = 'CircuitOpenError'; }
}

/**
 * Resilient inter-service HTTP client: timeout (AbortController), bounded retries
 * with exponential backoff (idempotent methods, or 5xx/429/network errors), a
 * per-host circuit breaker, and automatic trace + internal-auth header injection.
 * Uses global fetch (node20) — no axios dependency.
 */
export function createHttpClient(opts: HttpClientOptions = {}): HttpClient {
  const doFetch: FetchLike = opts.fetchImpl ?? ((globalThis as any).fetch as FetchLike);
  const timeoutMs = opts.defaultTimeoutMs ?? 8000;
  const retries = opts.defaultRetries ?? 2;
  const backoff = opts.defaultRetryBackoffMs ?? 200;
  const breaker = opts.circuitBreaker === false
    ? null
    : new Breaker({
        failureThreshold: opts.circuitBreaker?.failureThreshold ?? 5,
        resetTimeoutMs: opts.circuitBreaker?.resetTimeoutMs ?? 15_000,
        halfOpenMax: opts.circuitBreaker?.halfOpenMax ?? 1,
      });

  function resolveUrl(url: string, query?: HttpRequestOptions['query']): string {
    const full = opts.baseUrl && !/^https?:\/\//.test(url) ? `${opts.baseUrl.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}` : url;
    if (!query) return full;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v !== undefined) qs.set(k, String(v));
    const sep = full.includes('?') ? '&' : '?';
    return qs.toString() ? `${full}${sep}${qs}` : full;
  }

  async function request<T>(url: string, o: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const method = o.method ?? 'GET';
    const target = resolveUrl(url, o.query);
    const host = safeHost(target);
    const maxAttempts = (o.retries ?? (IDEMPOTENT.has(method) ? retries : 0)) + 1;
    const baseBackoff = o.retryBackoffMs ?? backoff;

    if (breaker && !breaker.canRequest(host)) {
      opts.logger?.warn?.({ host }, 'http: circuit open — short-circuiting');
      throw new CircuitOpenError(host);
    }

    const headers: Record<string, string> = { 'content-type': 'application/json', ...(o.headers ?? {}) };
    if (o.trace !== false && opts.trace) Object.assign(headers, opts.trace.outboundHeaders());
    if (o.internal && opts.internalAuth) {
      Object.assign(headers, opts.internalAuth.signHeaders({ method, path: pathOf(target), body: o.body != null ? JSON.stringify(o.body) : '' }));
    }

    let lastErr: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), o.timeoutMs ?? timeoutMs);
      try {
        const res = await doFetch(target, {
          method,
          headers,
          body: o.body != null ? JSON.stringify(o.body) : undefined,
          signal: o.signal ?? ac.signal,
        });
        clearTimeout(timer);
        const data = (await parseBody(res)) as T;
        if (res.status >= 500 || res.status === 429) {
          if (attempt < maxAttempts) { await sleep(baseBackoff * 2 ** (attempt - 1)); continue; }
          breaker?.onFailure(host);
        } else {
          breaker?.onSuccess(host);
        }
        return { status: res.status, ok: res.ok, data, headers: headerObj(res.headers) };
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        opts.logger?.warn?.({ host, attempt, err: String(err) }, 'http: request error');
        if (attempt < maxAttempts) { await sleep(baseBackoff * 2 ** (attempt - 1)); continue; }
        breaker?.onFailure(host);
      }
    }
    throw lastErr ?? new Error(`http: request to ${target} failed`);
  }

  return {
    request,
    get: (u, o) => request(u, { ...o, method: 'GET' }),
    post: (u, body, o) => request(u, { ...o, method: 'POST', body }),
    put: (u, body, o) => request(u, { ...o, method: 'PUT', body }),
    patch: (u, body, o) => request(u, { ...o, method: 'PATCH', body }),
    delete: (u, o) => request(u, { ...o, method: 'DELETE' }),
  };
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function safeHost(url: string): string { try { return new URL(url).host; } catch { return url; } }
function pathOf(url: string): string { try { return new URL(url).pathname; } catch { return url; } }
function headerObj(h: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (h?.forEach) h.forEach((v: string, k: string) => { out[k] = v; });
  return out;
}
async function parseBody(res: any): Promise<unknown> {
  const ct = res.headers?.get?.('content-type') ?? '';
  if (ct.includes('application/json')) { try { return await res.json(); } catch { return null; } }
  try { return await res.text(); } catch { return null; }
}
