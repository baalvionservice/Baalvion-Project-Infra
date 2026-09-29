// ctm-service is /api/v1/ecosystem/ctm at the gateway.
const CTM_BASE  = process.env.NEXT_PUBLIC_CTM_API_URL ?? 'https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1';
// Auth via the SAME-ORIGIN proxy (next.config rewrite → gateway) so the httpOnly
// `baalvion_refresh` cookie flows in dev and prod. NEVER an absolute cross-origin URL.
const AUTH_BASE = '/auth-bff';
const PROXY_BASE = AUTH_BASE; // /users/me etc. resolve under the auth base via the proxy

// Retained export for back-compat with importers; NO LONGER a web-storage key.
export const CTM_TOKEN_KEY = 'ctm_access_token';

// ── In-memory access token (P0: NO localStorage/sessionStorage). Refresh = httpOnly cookie. ──
let _accessToken: string | null = null;

export function getStoredToken(): string | null {
  return _accessToken;
}

export function storeTokens(accessToken: string, _refreshToken?: string): void {
  // Only the access token is held (in memory). The refresh token is the httpOnly cookie.
  _accessToken = accessToken || null;
}

export function storeToken(token: string): void {
  _accessToken = token || null;
}

export function clearStoredToken(): void {
  _accessToken = null;
  // Best-effort cleanup of any legacy mock-mode user blob (not a credential).
  if (typeof window !== 'undefined') localStorage.removeItem('skillmatch-user');
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // No body: the refresh token rides the httpOnly cookie. Backend rotates it.
      const res = await fetch(`${AUTH_BASE}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return false;

      const payload = await res.json().catch(() => ({}));
      const newAccess = payload?.data?.accessToken ?? payload?.accessToken ?? payload?.data?.token ?? payload?.token;
      if (newAccess) {
        // Old auth-service pattern: token returned in body.
        _accessToken = newAccess;
      } else if (payload?.ok === true) {
        // Gateway BFF pattern: { ok: true, csrfToken } — cookie was rotated, no token in body.
        // _accessToken stays null; reads work (optionalAuth); writes route through the gateway.
        _accessToken = null;
      } else {
        return false;
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** Silent session restore on app start: refresh via the httpOnly cookie. No redirect side-effects. */
export async function bootstrapSession(): Promise<boolean> {
  return attemptTokenRefresh();
}

async function request<T>(
  base: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  withAuth = true,
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = getStoredToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !isRetry && withAuth) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return request<T>(base, method, path, body, withAuth, true);
    }
    clearStoredToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (res.status === 401) {
    clearStoredToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? json?.message ?? `HTTP ${res.status}`);
  return (json.data ?? json) as T;
}

export const ctmClient = {
  get:    <T>(path: string)                => request<T>(CTM_BASE,   'GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>(CTM_BASE,   'POST',   path, body),
  patch:  <T>(path: string, body: unknown) => request<T>(CTM_BASE,   'PATCH',  path, body),
  delete: <T>(path: string)               => request<T>(CTM_BASE,   'DELETE', path),
};

export const ctmAuthClient = {
  post:   <T>(path: string, body: unknown) => request<T>(AUTH_BASE,  'POST',   path, body, false),
  get:    <T>(path: string)               => request<T>(AUTH_BASE,  'GET',    path),
  patch:  <T>(path: string, body: unknown) => request<T>(AUTH_BASE,  'PATCH',  path, body),
};

export const ctmProxyClient = {
  get:    <T>(path: string)               => request<T>(PROXY_BASE, 'GET',    path),
  patch:  <T>(path: string, body: unknown) => request<T>(PROXY_BASE, 'PATCH',  path, body),
};
