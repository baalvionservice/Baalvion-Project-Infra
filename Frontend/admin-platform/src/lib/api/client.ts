import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/lib/store/authStore';

const BASE_URL      = process.env.NEXT_PUBLIC_API_URL        || 'http://localhost:4000/v1';
const AUTH_URL      = process.env.NEXT_PUBLIC_AUTH_URL       || 'http://localhost:3001/v1/auth';
const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL  || 'http://localhost:3021/v1';
const SESSION_URL   = process.env.NEXT_PUBLIC_SESSION_API_URL || 'http://localhost:3022/v1';
const OAUTH_URL     = process.env.NEXT_PUBLIC_OAUTH_URL       || 'http://localhost:3023';

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

// ─── Response interceptor: handle 401 → refresh → retry ──────────────────────
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processPendingQueue = (error: unknown, token: string | null = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(normalizeError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers = original.headers ?? {};
        original.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await authClient.post<{
        data: { token?: string; accessToken?: string; expiresAt?: string; expiresIn?: number };
      }>('/refresh');
      const raw = data.data;
      const accessToken = raw.accessToken ?? raw.token ?? '';
      const expiresIn = raw.expiresIn ?? (raw.expiresAt
        ? Math.max(60, Math.floor((new Date(raw.expiresAt).getTime() - Date.now()) / 1000))
        : 900);
      useAuthStore.getState().setTokens(accessToken, expiresIn);
      processPendingQueue(null, accessToken);
      original.headers = original.headers ?? {};
      original.headers['Authorization'] = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      processPendingQueue(refreshError);
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

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

[adminApiClient, sessionApiClient, oauthApiClient].forEach((c) =>
  c.interceptors.request.use(attachToken, Promise.reject),
);

// ─── Per-service API clients ──────────────────────────────────────────────────
const makeServiceClient = (port: number, path = '/api/v1') =>
  axios.create({
    baseURL: `http://localhost:${port}${path}`,
    withCredentials: true,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

const serviceClients = {
  jobs: makeServiceClient(3002),
  mining: makeServiceClient(3003),
  imperialpedia: makeServiceClient(3004),
  realEstate: makeServiceClient(3005),
  brand: makeServiceClient(3006),
  market: makeServiceClient(3007),
  ir: makeServiceClient(3008),
  dashboard: makeServiceClient(3009),
  about: makeServiceClient(3010),
  ctm: makeServiceClient(3011),
  commerce: makeServiceClient(3012),
  orders: makeServiceClient(3013),
  inventory: makeServiceClient(3014),
  fulfillment: makeServiceClient(3015),
};

Object.values(serviceClients).forEach((client) => {
  client.interceptors.request.use(attachToken, Promise.reject);
});

export { serviceClients };
export default apiClient;
