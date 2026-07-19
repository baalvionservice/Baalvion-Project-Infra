/**
 * @file lib/local-api-client.ts
 * @description Browser client for THIS app's own `/api/*` orchestration routes
 * (search, compliance/goods-screening, sanctions/screen, trades, etc.) — distinct
 * from `api-client.ts`, which targets `/trade-bff/*` (the external auth-gateway).
 *
 * These local routes trust ONLY a signed identity envelope
 * (`x-identity-envelope`/`x-identity-signature`, see `server/http/identity.ts`) —
 * never client-supplied headers. Nothing mints that envelope for them
 * automatically, so callers must first mint one for the browser's own verified
 * session via `GET /api/session/identity` and attach it. This helper does that.
 *
 * SECURITY INVARIANT: this module never sends anything that asserts an identity
 * (no `x-actor-id`, `x-organization-id`, role, etc.) — actor identity comes
 * exclusively from the server-minted envelope. Do not add such a header here;
 * the server-side routes are hardened to ignore them, but this file should
 * never even attempt it, so a compromised/modified frontend build cannot
 * impersonate another user by forging request headers.
 *
 * HARDENING (security review pass):
 *   - Envelopes are minted fresh (never reused from cache) for every unsafe method
 *     (POST/PUT/PATCH/DELETE). The server enforces single-use ("replay") on those
 *     specifically — reusing a cached envelope across writes would either break that
 *     enforcement or force every write after the first to fail, so writes simply
 *     never share an envelope.
 *   - The read-only cache TTL is kept comfortably under the envelope's own (short)
 *     server-side TTL so a request is never sent with an envelope that is about to
 *     (or already did) expire.
 *   - The double-submit CSRF cookie is echoed on the mint request itself.
 *   - A second consecutive 401 (post-refresh) clears the cache and surfaces a clear,
 *     terminal "not authenticated" error instead of looping.
 */

interface CachedEnvelope {
  headers: Record<string, string>;
  mintedAt: number;
}

// The server mints a 90s envelope (see server/http/identity.ts DEFAULT_TTL_MS) — refresh
// well before that so a cached header set is never sent right at the edge of expiry.
const READ_ENVELOPE_TTL_MS = 45_000;
let cachedReadEnvelope: CachedEnvelope | null = null;
let inFlight: Promise<Record<string, string>> | null = null;

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function mintEnvelope(): Promise<Record<string, string>> {
  const csrf = readCsrfCookie();
  const res = await fetch('/api/session/identity', {
    method: 'GET',
    credentials: 'include',
    headers: csrf ? { 'x-csrf-token': csrf } : {},
    cache: 'no-store',
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.error || 'Not authenticated.');
  }
  return {
    'x-identity-envelope': payload.data.envelope,
    'x-identity-signature': payload.data.signature,
  };
}

/**
 * Single-flight mint for the READ cache ONLY, deduplicating concurrent GET-triggered cache
 * misses into one in-flight request. This must never be used for unsafe (write) methods: two
 * concurrent writes sharing this slot would receive the SAME envelope — and therefore the same
 * jti — and the server's single-use replay guard would then legitimately reject the second one
 * as a replay even though it was an entirely unrelated, simultaneous write. Reads are safe to
 * dedupe this way because the server never nonce-tracks safe methods.
 */
async function mintReadEnvelopeSingleFlight(): Promise<Record<string, string>> {
  if (!inFlight) {
    inFlight = mintEnvelope().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function getReadEnvelopeHeaders(forceRefresh = false): Promise<Record<string, string>> {
  if (!forceRefresh && cachedReadEnvelope && Date.now() - cachedReadEnvelope.mintedAt < READ_ENVELOPE_TTL_MS) {
    return cachedReadEnvelope.headers;
  }
  const headers = await mintReadEnvelopeSingleFlight();
  cachedReadEnvelope = { headers, mintedAt: Date.now() };
  return headers;
}

function isUnsafeMethod(method: string | undefined): boolean {
  const m = (method || 'GET').toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

/**
 * `fetch` against a local `/api/*` route with a signed identity envelope attached.
 *
 * - Safe methods (GET/HEAD) reuse a short-lived cached envelope across calls.
 * - Unsafe methods (POST/PUT/PATCH/DELETE) always mint a FRESH envelope — never cached,
 *   never reused — so each mutating call carries its own single-use nonce.
 * - Retries once with a freshly-minted envelope on a 401 (expired/rejected envelope); a
 *   second 401 after that is treated as a real, terminal auth failure.
 */
export async function fetchLocalApi(input: string, init: RequestInit = {}): Promise<Response> {
  const unsafe = isUnsafeMethod(init.method);
  const doFetch = (headers: Record<string, string>) =>
    fetch(input, {
      ...init,
      credentials: 'include',
      headers: { ...(init.headers as Record<string, string> | undefined), ...headers },
    });

  // Unsafe methods deliberately bypass ALL sharing/dedup (see mintReadEnvelopeSingleFlight's
  // doc comment) — every write, including concurrent ones, gets its own independently minted,
  // uniquely-jti'd envelope.
  const firstHeaders = unsafe ? await mintEnvelope() : await getReadEnvelopeHeaders();
  const res = await doFetch(firstHeaders);
  if (res.status !== 401) return res;

  // Envelope may have expired or (for a write) been legitimately single-use-consumed by a
  // prior attempt — mint a fresh one and retry exactly once.
  if (!unsafe) cachedReadEnvelope = null;
  const freshHeaders = unsafe ? await mintEnvelope() : await getReadEnvelopeHeaders(true);
  const retryRes = await doFetch(freshHeaders);
  if (retryRes.status === 401 && !unsafe) cachedReadEnvelope = null;
  return retryRes;
}
