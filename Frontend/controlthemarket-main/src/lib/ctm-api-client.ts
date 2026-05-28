// ctm-service is /api/v1/ecosystem/ctm at the gateway (was wrongly pointed at :3011 = cms-service).
const CTM_BASE  = process.env.NEXT_PUBLIC_CTM_API_URL ?? 'https://api.baalvion.com/api/v1/ecosystem/ctm/api/v1';
// auth via the single identity authority (auth-service) through the gateway, NOT proxy-service:4000.
const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL    ?? 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
const PROXY_BASE = AUTH_BASE.replace(/\/auth$/, '');

export const CTM_TOKEN_KEY         = 'ctm_access_token';
const        CTM_REFRESH_TOKEN_KEY = 'ctm_refresh_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CTM_TOKEN_KEY);
}

export function storeTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(CTM_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(CTM_REFRESH_TOKEN_KEY, refreshToken);
}

export function storeToken(token: string): void {
  localStorage.setItem(CTM_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(CTM_TOKEN_KEY);
  localStorage.removeItem(CTM_REFRESH_TOKEN_KEY);
  localStorage.removeItem('skillmatch-user');
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = typeof window !== 'undefined'
      ? localStorage.getItem(CTM_REFRESH_TOKEN_KEY)
      : null;
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${AUTH_BASE}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;

      const payload = await res.json();
      const newAccess  = payload?.data?.accessToken  ?? payload?.accessToken;
      const newRefresh = payload?.data?.refreshToken ?? payload?.refreshToken;

      if (!newAccess) return false;
      storeTokens(newAccess, newRefresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
