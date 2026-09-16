import type { ApiFailure, ApiMeta, ApiResponse } from './types';

/**
 * The HTTP client for canwemarry-service.
 *
 * Two properties are load-bearing:
 *
 *  1. NO TOKEN EVER TOUCHES THIS CODE. The browser holds an HttpOnly session cookie issued
 *     by the auth-gateway BFF and requests carry `credentials: 'include'`; the gateway
 *     verifies the session server-side and forwards a Bearer the page never sees. Reading a
 *     token into JavaScript — let alone into localStorage — would make every XSS a full
 *     account compromise, and the platform's CI guard rejects it outright.
 *
 *  2. It imports nothing from Next.js or the DOM, so the Expo application can use this file
 *     unchanged against the same endpoints.
 *
 * Errors are returned, not thrown: a page that cannot load its data should render an
 * ErrorState, not fall over.
 */

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, string[]>;
  status: number;
}

export type Result<T> =
  | { ok: true; data: T; meta: ApiMeta }
  | { ok: false; error: ApiError };

export type FetchImpl = (input: string, init?: RequestInit) => Promise<Response>;

export interface ClientOptions {
  /** Base URL of the API surface. Defaults to the BFF path, which requires no CORS. */
  baseUrl?: string;
  /** Forwarded on server-side renders so the session cookie reaches the gateway. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /**
   * Transport override. In the browser this is the auth SDK's `authFetch`, which attaches
   * the CSRF header and performs a single-flight refresh on a 401. Injecting it rather than
   * importing it keeps this file free of any web-only dependency, so React Native can supply
   * its own transport against the same endpoints.
   */
  fetchImpl?: FetchImpl;
}

// Fallback for a caller that reaches the client before configureApi has run. It is the
// full same-origin path (including the /auth-bff/api prefix the rewrite maps through), so
// a plain fetch against it still resolves — unlike the shorter base authFetch expects.
const DEFAULT_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/auth-bff/api/canwemarry/v1';

let defaults: { baseUrl?: string; fetchImpl?: FetchImpl } = {};

/** Set once at app start (see lib/auth/session.ts) so pages need not thread the transport. */
export function configureApi(options: { baseUrl?: string; fetchImpl?: FetchImpl }) {
  defaults = { ...defaults, ...options };
}

const failure = (status: number, code: string, message: string, details: Record<string, string[]> = {}): ApiError =>
  ({ status, code, message, details });

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
  options: ClientOptions = {},
): Promise<Result<T>> {
  const base = options.baseUrl ?? defaults.baseUrl ?? DEFAULT_BASE;
  const url = `${base}${path}`;
  const send = options.fetchImpl ?? defaults.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await send(url, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
      cache: 'no-store',
    });
  } catch {
    // A network failure carries no server detail worth surfacing, and the raw message
    // ("fetch failed") tells a reader nothing useful.
    return { ok: false, error: failure(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.') };
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    const err = (payload as ApiFailure | null)?.error;
    return {
      ok: false,
      error: failure(
        response.status,
        err?.code ?? 'REQUEST_FAILED',
        err?.message ?? 'Something went wrong. Please try again.',
        err?.details ?? {},
      ),
    };
  }

  return { ok: true, data: payload.data, meta: payload.meta };
}

const query = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
};

export const api = {
  get: <T>(path: string, options?: ClientOptions) => call<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: ClientOptions) => call<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: ClientOptions) => call<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: ClientOptions) => call<T>('PATCH', path, body, options),
  // DELETE carries a body for the routes that need one (role revocation validates req.body).
  delete: <T>(path: string, body?: unknown, options?: ClientOptions) => call<T>('DELETE', path, body, options),
  query,
};
