/**
 * JWT-based API client for company-unified-dashboard.
 * Connects to proxy-backend (:4000/v1/auth) for authentication
 * and dashboard-service (:3009) for dashboard data.
 */

const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_API_URL || 'https://api.baalvion.com/api/v1/platform/dashboard/api/v1';

const TOKEN_KEY = 'baalvion_dash_token';
const REFRESH_KEY = 'baalvion_dash_refresh';
const USER_KEY = 'baalvion_dash_user';

export interface DashAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  orgId?: string;
  avatarUrl?: string | null;
}

export interface DashAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  user: DashAuthUser;
}

// ─── Token helpers ────────────────────────────────────────────────────────────
export const tokenStore = {
  getAccess: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  getRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null),
  getUser: (): DashAuthUser | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as DashAuthUser) : null;
    } catch {
      return null;
    }
  },
  set: (tokens: DashAuthTokens) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    [TOKEN_KEY, REFRESH_KEY, USER_KEY].forEach((k) => localStorage.removeItem(k));
  },
};

// ─── Core fetch with auth + refresh ──────────────────────────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshTokens(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${AUTH_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json.data ?? json;
    const newAccess: string = raw.accessToken ?? raw.token ?? '';
    const newRefresh: string = raw.refreshToken ?? refreshToken;
    const user = tokenStore.getUser()!;
    tokenStore.set({ accessToken: newAccess, refreshToken: newRefresh, user });
    return newAccess;
  } catch {
    return null;
  }
}

async function authFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenStore.getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && token) {
    if (isRefreshing) {
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      }
    } else {
      isRefreshing = true;
      const newToken = await refreshTokens();
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      isRefreshing = false;

      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(url, { ...options, headers });
      } else {
        tokenStore.clear();
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
        throw new Error('Session expired');
      }
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(json?.error?.message || `Request failed (${res.status})`), {
      status: res.status,
      code: json?.error?.code || 'UNKNOWN',
    });
  }
  return (json.data ?? json) as T;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
function normalizeTokenResponse(raw: Record<string, unknown>): DashAuthTokens {
  const userRaw = (raw.user as Record<string, unknown>) ?? {};
  return {
    accessToken: String(raw.accessToken ?? raw.token ?? ''),
    refreshToken: String(raw.refreshToken ?? ''),
    expiresAt: raw.expiresAt as string | undefined,
    user: {
      id: String(userRaw.id ?? ''),
      email: String(userRaw.email ?? ''),
      name: String(userRaw.fullName ?? userRaw.name ?? ''),
      role: String(userRaw.role ?? 'EMPLOYEE'),
      orgId: userRaw.orgId as string | undefined,
      avatarUrl: (userRaw.avatarUrl as string | null) ?? null,
    },
  };
}

export const authApi = {
  login: async (email: string, password: string): Promise<DashAuthTokens> => {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json?.error?.message || 'Login failed');
    }
    return normalizeTokenResponse(json.data as Record<string, unknown>);
  },

  logout: async (): Promise<void> => {
    const token = tokenStore.getAccess();
    if (token) {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    tokenStore.clear();
  },

  me: (): Promise<DashAuthUser> =>
    authFetch<DashAuthUser>(`${AUTH_URL}/users/me`),
};

// ─── Dashboard API ────────────────────────────────────────────────────────────
const get = <T>(path: string) => authFetch<T>(`${DASHBOARD_URL}${path}`);
const post = <T>(path: string, body?: object) =>
  authFetch<T>(`${DASHBOARD_URL}${path}`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export const dashboardApi = {
  summary: () => get('/dashboard/summary'),
  businesses: () => get('/businesses'),
  employees: () => get('/employees'),
  kpis: () => get('/kpis'),
  payments: () => get('/payments'),
  finance: () => get('/finance/overview'),
  financials: () => get('/financials'),
  countries: () => get('/countries'),
  equity: () => get('/equity'),
  corporate: () => get('/corporate-actions'),
  fxRates: () => get('/fx-rates'),
  notifications: () => get('/notifications'),
  markNotificationRead: (id: string) => post(`/notifications/${id}/read`),
  auditLogs: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return get(`/audit-logs${qs ? `?${qs}` : ''}`);
  },
  analytics: {
    businesses: () => get('/analytics/businesses'),
    domains: () => get('/analytics/domains'),
    forecast: () => get('/analytics/forecast'),
  },
};
