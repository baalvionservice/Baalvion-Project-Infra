/**
 * Baalvion OS REST client (replaces Firestore data access).
 *
 * Talks to the unified NestJS backend at NEXT_PUBLIC_BAALVION_API_URL.
 * Attaches the Keycloak access token (set by the auth layer) as a Bearer header.
 * A thin `collection()` helper mirrors the old Firestore ergonomics so page
 * migrations stay mechanical: list / get / create / update / remove.
 */
import axios from 'axios';

// Same-origin by default: the fb-compat REST shim calls bare resource names (/campaigns, /leads,
// /files/presign, …). These are proxied to the backend's `/api/v1` mount via the `/brand-bff`
// rewrite in next.config (server-side, forwards the Bearer header), keeping the strict prod CSP happy.
const BASE_URL = process.env.NEXT_PUBLIC_BAALVION_API_URL || '/brand-bff';

export const baalvion = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Bearer token is populated by the Keycloak auth provider (see auth wiring).
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

baalvion.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Self-healing 401: the access token is short-lived (15 min). On expiry, rotate it once via the
// httpOnly refresh cookie (same-origin /auth-bff/refresh) and retry the original request — mirroring
// the typed api-client so the fb-compat REST shim survives token expiry without forcing a re-login.
let baalvionRefreshing: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  if (!baalvionRefreshing) {
    baalvionRefreshing = (async () => {
      try {
        const res = await fetch('/auth-bff/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => ({}));
        const raw = json.data ?? json;
        const next: string | null = raw.accessToken ?? raw.token ?? null;
        if (next) setAccessToken(next);
        return next;
      } catch {
        return null;
      } finally {
        // release the singleton after this tick so concurrent 401s share one refresh
        setTimeout(() => { baalvionRefreshing = null; }, 0);
      }
    })();
  }
  return baalvionRefreshing;
}

baalvion.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    if (status === 401 && accessToken && !original.__retried) {
      original.__retried = true;
      const next = await refreshAccessToken();
      if (next) {
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${next}` };
        return baalvion(original);
      }
    }
    const message = error.response?.data?.message || error.message || 'Request failed';
    console.error('[baalvion]', original.method, original.url, '->', message);
    return Promise.reject(error);
  },
);

/**
 * Resource helper — `collection('broadcasts').list()` etc.
 * Maps the Firestore mental model onto REST endpoints.
 */
export function collection<T = any>(resource: string) {
  return {
    list: async (params?: Record<string, any>): Promise<T[]> => {
      const { data } = await baalvion.get(`/${resource}`, { params });
      return (data?.data ?? data) as T[];
    },
    get: async (id: string): Promise<T> => {
      const { data } = await baalvion.get(`/${resource}/${id}`);
      return (data?.data ?? data) as T;
    },
    create: async (body: Partial<T>): Promise<T> => {
      const { data } = await baalvion.post(`/${resource}`, body);
      return (data?.data ?? data) as T;
    },
    update: async (id: string, body: Partial<T>): Promise<T> => {
      const { data } = await baalvion.patch(`/${resource}/${id}`, body);
      return (data?.data ?? data) as T;
    },
    remove: async (id: string): Promise<void> => {
      await baalvion.delete(`/${resource}/${id}`);
    },
  };
}

export default baalvion;
