
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

import { refresh as authRefresh } from './authClient';

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL        || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
// Domain data via the gateway (port 4100 was a phantom backend).
const JOBS_BASE = process.env.NEXT_PUBLIC_JOBS_SERVICE_URL || 'https://api.baalvion.com/api/v1/ecosystem/jobs/api/v1';

// Access token is held in MEMORY only. The refresh token is an httpOnly cookie set by
// auth-service — never stored in localStorage (canonical, XSS-resistant).
let _accessToken: string | null = null;

export function getBearerToken(): string | null {
  return _accessToken;
}

export function setTokens(accessToken: string) {
  _accessToken = accessToken || null;
}

export function clearTokens() {
  _accessToken = null;
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const access = await authRefresh(); // uses the httpOnly refresh cookie
      if (!access) return false;
      setTokens(access);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return;
  clearTokens();
  window.location.href = '/login';
}

async function doRequest<T>(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown,
  isRetry = false,
): Promise<ApiResponse<T>> {
  const token = getBearerToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 && !isRetry) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        return doRequest<T>(baseUrl, method, path, body, true);
      }
      handleUnauthorized();
      return { success: false, data: null, error: 'Session expired. Please log in again.' };
    }

    if (res.status === 401 && isRetry) {
      handleUnauthorized();
      return { success: false, data: null, error: 'Session expired. Please log in again.' };
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = {};
    }

    if (!res.ok) {
      const err = json as Record<string, unknown>;
      const msg =
        (err?.error as Record<string, string>)?.message ??
        (err?.message as string) ??
        res.statusText;
      return { success: false, data: null, error: msg };
    }

    const payload = json as Record<string, unknown>;
    if ('success' in payload) {
      return payload as unknown as ApiResponse<T>;
    }
    return { success: true, data: payload as T, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { success: false, data: null, error: message };
  }
}

// ── Jobs-service client (default for all domain routes) ───────────────────────
export const apiClient = {
  get:    <T>(path: string)                    => doRequest<T>(JOBS_BASE, 'GET',    path),
  post:   <T>(path: string, body: unknown)     => doRequest<T>(JOBS_BASE, 'POST',   path, body),
  put:    <T>(path: string, body: unknown)     => doRequest<T>(JOBS_BASE, 'PUT',    path, body),
  patch:  <T>(path: string, body: unknown)     => doRequest<T>(JOBS_BASE, 'PATCH',  path, body),
  delete: <T>(path: string, body?: unknown)    => doRequest<T>(JOBS_BASE, 'DELETE', path, body),
};

// ── Unwrap helper ─────────────────────────────────────────────────────────────
export async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise;
  if (!res.success || res.data === null) {
    throw new Error(res.error ?? 'API call failed');
  }
  return res.data;
}

// ── Auth client (auth-service) ────────────────────────────────────────────────
export const authApiClient = {
  get:    <T>(path: string)                    => doRequest<T>(AUTH_BASE, 'GET',    path),
  post:   <T>(path: string, body: unknown)     => doRequest<T>(AUTH_BASE, 'POST',   path, body),
  patch:  <T>(path: string, body: unknown)     => doRequest<T>(AUTH_BASE, 'PATCH',  path, body),
  delete: <T>(path: string, body?: unknown)    => doRequest<T>(AUTH_BASE, 'DELETE', path, body),
};
