import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const BASE_URL      = process.env.NEXT_PUBLIC_API_URL        || 'https://api.baalvion.com/api/v1/infrastructure/proxy/v1';
// Auth goes through the SAME-ORIGIN proxy (next.config rewrite → gateway) so the httpOnly
// `baalvion_refresh` cookie is stored against this origin and flows on every refresh.
const AUTH_URL      = '/auth-bff';
const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL  || 'https://api.baalvion.com/api/v1/platform/admin/v1';
const SESSION_URL   = process.env.NEXT_PUBLIC_SESSION_API_URL || 'https://api.baalvion.com/api/v1/identity/session/v1';
const OAUTH_URL     = process.env.NEXT_PUBLIC_OAUTH_URL       || 'https://api.baalvion.com/api/v1/identity/oauth';
// CMS engine (cms-service). Multi-site content/taxonomy/media/workflow API.
const CMS_API_URL   = process.env.NEXT_PUBLIC_CMS_API_URL     || 'https://api.baalvion.com/api/v1/knowledge/cms/api/v1';

// ─── Main API client ──────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth API client (separate to avoid circular refresh loops) ───────────────
export const authClient = axios.create({
  baseURL: AUTH_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach access token ────────────────────────────────
const attachToken = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

apiClient.interceptors.request.use(attachToken, Promise.reject);
authClient.interceptors.request.use(attachToken, Promise.reject);

// ─── Shared single-flight refresh ─────────────────────────────────────────────
// The access token is in-memory only; on a 401 (or on app bootstrap) we exchange the
// httpOnly `baalvion_refresh` cookie for a fresh access token. Refresh tokens are
// ROTATED and reuse is FATAL (auth-service revokes the whole session on reuse), so
// every refresh — interceptor-driven OR the AuthProvider bootstrap — MUST coalesce
// into a single in-flight request. This module-level singleton guarantees that.
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = authClient
      .post<{ data: { token?: string; accessToken?: string; expiresAt?: string; expiresIn?: number } }>('/refresh')
      .then(({ data }) => {
        const raw = data.data;
        const accessToken = raw.accessToken ?? raw.token ?? '';
        if (!accessToken) throw new Error('refresh: no access token returned');
        const expiresIn = raw.expiresIn ?? (raw.expiresAt
          ? Math.max(60, Math.floor((new Date(raw.expiresAt).getTime() - Date.now()) / 1000))
          : 900);
        useAuthStore.getState().setTokens(accessToken, expiresIn);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// ─── Response interceptor: 401 → coalesced refresh → retry on the SAME client ──
// Shared by every axios instance (main, admin, session, oauth, per-service) so any
// 401 recovers via one refresh. Applied via attachAuthRetry() below.
const makeAuthRetryInterceptor =
  (client: typeof apiClient) =>
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(normalizeError(error));
    }
    original._retry = true;
    try {
      const token = await refreshAccessToken();
      original.headers = { ...(original.headers ?? {}), Authorization: `Bearer ${token}` };
      return client(original);
    } catch {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(normalizeError(error));
    }
  };

const attachAuthRetry = (client: typeof apiClient) =>
  client.interceptors.response.use((r) => r, makeAuthRetryInterceptor(client));

attachAuthRetry(apiClient);

// ─── Error normalizer ─────────────────────────────────────────────────────────
export interface NormalizedError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

export const normalizeError = (error: AxiosError): NormalizedError => {
  const data = error.response?.data as {
    error?: { code?: string; message?: string; details?: Record<string, unknown> };
    message?: string;
  } | undefined;

  return {
    code: data?.error?.code ?? 'UNKNOWN_ERROR',
    message: data?.error?.message ?? data?.message ?? error.message ?? 'An unexpected error occurred',
    status: error.response?.status ?? 0,
    details: data?.error?.details,
  };
};

// ─── Identity service clients ─────────────────────────────────────────────────
export const adminApiClient = axios.create({
  baseURL: ADMIN_API_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

export const sessionApiClient = axios.create({
  baseURL: SESSION_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

export const oauthApiClient = axios.create({
  baseURL: OAUTH_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

export const cmsApiClient = axios.create({
  baseURL: CMS_API_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

[adminApiClient, sessionApiClient, oauthApiClient, cmsApiClient].forEach((c) => {
  c.interceptors.request.use(attachToken, Promise.reject);
  attachAuthRetry(c);
});

// ─── Per-service API clients ──────────────────────────────────────────────────
// Base-URL resolution: dev → http://localhost:<port>. Production (browser can't reach localhost)
// overrides WITHOUT code changes via env:
//   NEXT_PUBLIC_SERVICE_URLS  — JSON map name→full base URL (gateway routes), e.g.
//     {"commerce":"https://api.example.com/commerce/api/v1","audit":"https://api.example.com/audit/v1"}
//   NEXT_PUBLIC_SERVICES_HOST — override just the host (default http://localhost), keeping :port + path.
let SERVICE_URL_MAP: Record<string, string> = {};
try {
  SERVICE_URL_MAP = JSON.parse(process.env.NEXT_PUBLIC_SERVICE_URLS || '{}');
} catch {
  SERVICE_URL_MAP = {};
}
const SERVICES_HOST = process.env.NEXT_PUBLIC_SERVICES_HOST || 'http://localhost';

const makeServiceClient = (name: string, port: number, path = '/api/v1') =>
  axios.create({
    baseURL: SERVICE_URL_MAP[name] || `${SERVICES_HOST}:${port}${path}`,
    withCredentials: true,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

const serviceClients = {
  jobs: makeServiceClient('jobs', 3002),
  mining: makeServiceClient('mining', 3003),
  imperialpedia: makeServiceClient('imperialpedia', 3004),
  realEstate: makeServiceClient('realEstate', 3005),
  brand: makeServiceClient('brand', 3006),
  market: makeServiceClient('market', 3007),
  ir: makeServiceClient('ir', 3008),
  dashboard: makeServiceClient('dashboard', 3009),
  about: makeServiceClient('about', 3020),
  ctm: makeServiceClient('ctm', 3017),
  commerce: makeServiceClient('commerce', 3012),
  orders: makeServiceClient('orders', 3013),
  inventory: makeServiceClient('inventory', 3014),
  fulfillment: makeServiceClient('fulfillment', 3016), // fulfillment-service: shipping zones, couriers, shipments
  law: makeServiceClient('law', 3015, '/v1'), // law-service mounts at /v1 (not /api/v1)
  // rbac-service is the single source of truth for the admin hierarchy + store-team roles.
  // It mounts at both /v1 and /api/v1; the caller's bearer token is forwarded by the shared
  // attachToken interceptor so RBAC enforces requireScopeAdmin on every mutation.
  rbac: makeServiceClient('rbac', 3055),
  // audit-service is the immutable hash-chain audit log (WORM). It mounts at /v1 and powers the
  // Audit Center (RBAC / payment / security event viewers, verify, CSV export).
  audit: makeServiceClient('audit', 3032, '/v1'),
  // notification-service is the multi-channel delivery engine (email/sms/push/in-app). It mounts at
  // /v1 (routes live under /v1/notifications/*) and powers the Notifications console: queue stats +
  // the dead-letter queue (failed deliveries) viewer/retry. Admin reads require a super_admin/admin
  // bearer (requireAdmin), forwarded by the shared attachToken interceptor.
  notifications: makeServiceClient('notifications', 3031, '/v1'),
};

Object.values(serviceClients).forEach((client) => {
  client.interceptors.request.use(attachToken, Promise.reject);
  attachAuthRetry(client);
});

export { serviceClients };
export default apiClient;
