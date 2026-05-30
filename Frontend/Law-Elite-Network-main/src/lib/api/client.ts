import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.baalvion.com/api/v1/knowledge/law/v1';
export const TOKEN_KEY = 'baalvion_law_token'; // retained export for back-compat (NOT a storage key)

// SECURITY (P0): access token in memory ONLY — never localStorage/sessionStorage.
// NOTE: law-service is an HS256 island that does not (yet) issue an httpOnly refresh cookie, so
// there is no silent refresh — the session lives for the tab's lifetime and a full page reload
// requires re-authentication. httpOnly-cookie refresh for law-service is a Phase 1b backend
// dependency (tracked alongside the elite-circle island).
let _accessToken: string | null = null;

export function getToken(): string | null {
  return _accessToken;
}

export function setToken(token: string): void {
  _accessToken = token || null;
}

export function clearToken(): void {
  _accessToken = null;
}

// Admin "View as" impersonation: when set (to a target legal.users id), the authenticated
// apiClient sends X-Impersonate-User-Id so law-service scopes requests to that user.
// Persisted in sessionStorage so it survives reloads within the tab.
let _impersonateId: string | null = null;
export function setImpersonation(id: string | null): void {
  _impersonateId = id || null;
  if (typeof window !== 'undefined') {
    if (id) sessionStorage.setItem('law_impersonate', id);
    else sessionStorage.removeItem('law_impersonate');
  }
}
export function getImpersonation(): string | null {
  if (_impersonateId) return _impersonateId;
  if (typeof window !== 'undefined') _impersonateId = sessionStorage.getItem('law_impersonate');
  return _impersonateId;
}

// Public client — no auth, for public content (articles, categories, etc.)
export const publicClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Authenticated client — attaches JWT from localStorage
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Deduped in-flight refresh so concurrent callers (AuthProvider mount, apiClient request
// interceptor, 401 retry) share ONE refresh call. The auth-service rotates refresh tokens,
// so concurrent independent refreshes would trip reuse-detection and 401 — this prevents that.
let _refreshInFlight: Promise<string | null> | null = null;
export function silentRefresh(): Promise<string | null> {
  if (!_refreshInFlight) {
    _refreshInFlight = refreshAccessToken().finally(() => { _refreshInFlight = null; });
  }
  return _refreshInFlight;
}
const refreshOnce = silentRefresh;

apiClient.interceptors.request.use(async (config) => {
  let token = getToken();
  // On a hard navigation the in-memory token isn't set yet; restore it from the
  // httpOnly refresh cookie BEFORE the request so authed calls don't 401-then-retry.
  if (!token && typeof window !== 'undefined') {
    token = await refreshOnce();
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const imp = getImpersonation();
  if (imp) config.headers['X-Impersonate-User-Id'] = imp;
  return config;
});

// On 401, attempt a one-time silent refresh (via the same-origin BFF) and retry the
// original request. This makes hard navigations to authed pages robust (the in-memory
// token is restored mid-flight) and transparently handles access-token expiry.
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    const json = await res.json().catch(() => null);
    const at = json?.data?.accessToken || json?.accessToken || null;
    if (at) setToken(at);
    return at;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      const at = await refreshOnce();
      if (at) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${at}`;
        return apiClient(original);
      }
    }
    const message = err.response?.data?.error?.message || err.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

// Legacy compat — components that called initBackendAuth can still call this safely
export async function initBackendAuth(): Promise<void> {}

// Auth goes through the same-origin Next.js BFF (/api/auth/*), which forwards to
// the Node auth-service server-side (no CORS) and manages the httpOnly refresh cookie.
// withCredentials so that cookie is sent/received on this origin.
export const authBffClient = axios.create({
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export const authLawApi = {
  login: (email: string, password: string) =>
    authBffClient.post('/api/auth/login', { email, password }),
  register: (email: string, password: string, name: string, role?: string) =>
    authBffClient.post('/api/auth/register', { email, password, name, fullName: name, role }),
  refresh: () => authBffClient.post('/api/auth/refresh'),
  logout: () => authBffClient.post('/api/auth/logout'),
  me: () => apiClient.get('/auth/me'),
};

export const articlesPublicApi = {
  list: (params?: Record<string, unknown>) => publicClient.get('/articles', { params }),
  get: (slugOrId: string) => publicClient.get(`/articles/${slugOrId}`),
};

export const categoriesPublicApi = {
  list: () => publicClient.get('/categories'),
  get: (slugOrId: string) => publicClient.get(`/categories/${slugOrId}`),
};

export const subcategoriesPublicApi = {
  list: (params?: Record<string, unknown>) => publicClient.get('/subcategories', { params }),
};

export const lawyerApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/lawyers', { params }),
  get: (id: string) => apiClient.get(`/lawyers/${id}`),
  search: (q: string, filters?: Record<string, unknown>) =>
    publicClient.get('/lawyers/search', { params: { q, ...filters } }),
  updateProfile: (id: string, data: unknown) => apiClient.patch(`/lawyers/${id}`, data),
};

export const bookingApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/bookings', { params }),
  get: (id: string) => apiClient.get(`/bookings/${id}`),
  create: (data: unknown) => apiClient.post('/bookings', data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/bookings/${id}/status`, { status }),
  cancel: (id: string) => apiClient.patch(`/bookings/${id}/status`, { status: 'cancelled' }),
};

export const caseApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/cases', { params }),
  get: (id: string) => apiClient.get(`/cases/${id}`),
  create: (data: unknown) => apiClient.post('/cases', data),
  update: (id: string, data: unknown) => apiClient.put(`/cases/${id}`, data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/cases/${id}/status`, { status }),
};

export const messageApi = {
  list: (params: Record<string, unknown>) => apiClient.get('/messages', { params }),
  send: (data: unknown) => apiClient.post('/messages', data),
};

export const documentApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/documents', { params }),
  upload: (data: unknown) => apiClient.post('/documents', data),
  delete: (id: string) => apiClient.delete(`/documents/${id}`),
};

export const paymentApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/payments', { params }),
  create: (data: unknown) => apiClient.post('/payments', data),
};

export const subscriptionApi = {
  get: () => apiClient.get('/subscriptions'),
  create: (data: unknown) => apiClient.post('/subscriptions', data),
  cancel: () => apiClient.post('/subscriptions/cancel'),
};

export const reviewApi = {
  // Public read (reviews are visible on lawyer profiles); backend filters by lawyer_id.
  list: (lawyerId: string) => publicClient.get('/reviews', { params: { lawyer_id: lawyerId } }),
  create: (data: unknown) => apiClient.post('/reviews', data),
};

export const articleApi = {
  list: (params?: Record<string, unknown>) => publicClient.get('/articles', { params }),
  get: (slug: string) => publicClient.get(`/articles/${slug}`),
};

export const notificationApi = {
  list: () => apiClient.get('/notifications'),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read'),
};

export const referralApi = {
  getMyCode: () => apiClient.get('/referrals/my-code'),
  stats: () => apiClient.get('/referrals/stats'),
  apply: (code: string) => apiClient.post('/referrals/apply', { code }),
};

export const adminApi = {
  dashboard: () => apiClient.get('/admin/dashboard'),
  analytics: (params?: Record<string, unknown>) => apiClient.get('/admin/analytics', { params }),
  listUsers: (params?: Record<string, unknown>) => apiClient.get('/admin/users', { params }),
};
