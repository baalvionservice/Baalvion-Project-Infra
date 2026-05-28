/**
 * Baalvion OS REST client (replaces Firestore data access).
 *
 * Talks to the unified NestJS backend at NEXT_PUBLIC_BAALVION_API_URL.
 * Attaches the Keycloak access token (set by the auth layer) as a Bearer header.
 * A thin `collection()` helper mirrors the old Firestore ergonomics so page
 * migrations stay mechanical: list / get / create / update / remove.
 */
import axios from 'axios';

// brand-connector-service via the gateway (port 4100 was a phantom "unified backend" — never existed).
const BASE_URL =
  process.env.NEXT_PUBLIC_BAALVION_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/brand-connector/api/v1';

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

baalvion.interceptors.response.use(
  (r) => r,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    console.error('[baalvion]', error.config?.method, error.config?.url, '->', message);
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
