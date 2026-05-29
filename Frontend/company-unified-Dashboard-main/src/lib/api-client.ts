/**
 * Gateway-BFF API client for company-unified-dashboard.
 *
 * CUTOVER — pure BFF cookie model (auth-gateway):
 *  - Auth + data both go SAME-ORIGIN and are rewritten to the auth-gateway (see next.config.ts):
 *      /auth-bff/*  ->  gateway /auth/*   (login, me, refresh, logout)
 *      /api-bff/*   ->  gateway /api/*    (data, proxied to backend services)
 *  - NO token in JS. Auth is HttpOnly cookies set by the gateway (access_token + refresh_token)
 *    plus a JS-readable csrf_token (double-submit). Every request uses credentials:'include';
 *    unsafe methods send x-csrf-token. "Authenticated" == an identity exists (from /auth/me),
 *    not a token in memory.
 */

const AUTH_URL = '/auth-bff';
// Data goes to the `dashboard` service via the gateway: /api-bff/* -> gateway /api/* routes by the
// first path segment, so `dashboard` selects dashboard-service and `/v1` is its route base.
const API_URL  = '/api-bff/dashboard/v1';

export interface DashAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId?: string;
  avatarUrl?: string | null;
}

export interface DashAuthTokens {
  accessToken: string; // always '' in the BFF model (no JS-readable token); kept for call-site compat
  refreshToken?: string;
  expiresAt?: string;
  user: DashAuthUser;
}

// ─── In-memory session — identity only (no token in the BFF model) ───────────────
let _user: DashAuthUser | null = null;

export const tokenStore = {
  getAccess: (): string | null => null,   // BFF: there is no JS-readable access token
  getRefresh: (): string | null => null,
  getUser: (): DashAuthUser | null => _user,
  set: (tokens: DashAuthTokens) => { if (tokens.user) _user = tokens.user; },
  setUser: (user: DashAuthUser | null) => { _user = user; },
  clear: () => { _user = null; },
};

function csrf(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1] ?? '';
}

function normalizeUser(raw: Record<string, unknown>): DashAuthUser {
  const roles = raw.roles;
  return {
    id: String(raw.userId ?? raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.fullName ?? raw.name ?? raw.email ?? ''),
    role: String((Array.isArray(roles) ? roles[0] : raw.role) ?? 'EMPLOYEE'),
    orgId: (raw.orgId as string | undefined) ?? undefined,
    avatarUrl: (raw.avatarUrl as string | null) ?? null,
  };
}

// ─── Single-flight refresh (rotates the HttpOnly cookies; nothing returned to JS) ───
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${AUTH_URL}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf() },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// ─── Data fetch via the gateway proxy: cookie + csrf, single-flight 401→refresh→retry ───
async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const build = (): RequestInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (method !== 'GET' && method !== 'HEAD') headers['x-csrf-token'] = csrf();
    return { ...options, credentials: 'include', headers };
  };

  let res = await fetch(`${API_URL}${path}`, build());
  if (res.status === 401) {
    if (await refreshSession()) {
      res = await fetch(`${API_URL}${path}`, build());
    } else {
      tokenStore.clear();
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
      throw new Error('Session expired');
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error((json as { error?: { message?: string } })?.error?.message || `Request failed (${res.status})`), {
      status: res.status,
      code: (json as { error?: { code?: string } })?.error?.code || 'UNKNOWN',
    });
  }
  return ((json as { data?: T }).data ?? json) as T;
}

// ─── Auth API (gateway BFF) ─────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string): Promise<DashAuthTokens> => {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((json as { error?: { message?: string } })?.error?.message || 'Login failed');
    }
    // Gateway returns { user, csrfToken } (no token). Tolerate auth-service { success, data:{user} } too.
    const rawUser = (json as { user?: unknown; data?: { user?: unknown } }).user
      ?? (json as { data?: { user?: unknown } }).data?.user
      ?? {};
    const user = normalizeUser(rawUser as Record<string, unknown>);
    _user = user;
    return { accessToken: '', user };
  },

  logout: async (): Promise<void> => {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-csrf-token': csrf() },
      });
    } catch {
      /* best-effort; the gateway clears cookies server-side regardless */
    }
    _user = null;
  },

  me: async (): Promise<DashAuthUser> => {
    const res = await fetch(`${AUTH_URL}/me`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Not authenticated');
    const json = await res.json().catch(() => ({}));
    const raw = (json as { user?: unknown; data?: unknown }).user
      ?? (json as { data?: unknown }).data
      ?? json;
    return normalizeUser(raw as Record<string, unknown>);
  },
};

/** Silent session restore on app start: probe the cookie session; refresh once if needed. */
export async function bootstrapSession(): Promise<DashAuthUser | null> {
  try {
    const u = await authApi.me();
    _user = u;
    return u;
  } catch {
    /* no live cookie session — try a refresh */
  }
  if (await refreshSession()) {
    try {
      const u = await authApi.me();
      _user = u;
      return u;
    } catch {
      /* refresh succeeded but /me failed — treat as unauthenticated */
    }
  }
  _user = null;
  return null;
}

// ─── Dashboard API (proxied through the gateway /api) ────────────────────────────
const get = <T>(path: string) => authFetch<T>(path);
const post = <T>(path: string, body?: object) =>
  authFetch<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export const dashboardApi = {
  summary: () => get('/dashboard/total'),
  businesses: () => get('/domains'),        // dashboard-service models "businesses" as domains
  employees: () => get('/employees'),
  kpis: () => get('/kpis'),
  payments: () => get('/transactions'),     // payments are transactions in dashboard-service
  finance: () => get('/financials'),
  financials: () => get('/financials'),
  countries: () => get('/countries'),
  equity: () => get('/shareholders'),      // equity = cap table (shareholders)
  corporate: () => get('/corporate-actions'),
  fxRates: () => get('/fx-rates'),
  notifications: () => get('/notifications'),
  compliance: () => get('/compliance'),
  markNotificationRead: (id: string) => post(`/notifications/${id}/read`),
  auditLogs: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return get(`/audit/logs${qs ? `?${qs}` : ''}`);
  },
  analytics: {
    businesses: () => get('/analytics/company/summary'),
    domains: () => get('/analytics/domains/trends'),
    forecast: () => get('/analytics/company/summary'),
  },
};
