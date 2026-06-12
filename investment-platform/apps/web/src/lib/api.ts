'use client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const ACCESS_KEY = 'bv_access';
const REFRESH_KEY = 'bv_refresh';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401 && retry && (await refresh())) {
    return api<T>(path, options, false);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, (body as any)?.error ?? res.statusText);
  }
  return body as T;
}

// ── Auth helpers ─────────────────────────────────────────────────────────────

export interface AuthUser {
  userId: string;
  email: string;
  orgId: string;
  role: string;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Login failed');
  if (data.mfaRequired) return { mfaRequired: true as const, challengeToken: data.challengeToken };
  setTokens(data.accessToken, data.refreshToken);
  return { mfaRequired: false as const };
}

export async function verifyMfa(challengeToken: string, code: string) {
  const res = await fetch(`${API_URL}/auth/mfa/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Invalid code');
  setTokens(data.accessToken, data.refreshToken);
}

export async function register(input: {
  email: string;
  password: string;
  fullName: string;
  country?: string;
}) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Registration failed');
  setTokens(data.accessToken, data.refreshToken);
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await api<{ user: AuthUser }>('/auth/me');
  return data.user;
}
