/**
 * IR-Baalvion Auth Client
 * Real JWT authentication against proxy-backend at :4000/v1/auth.
 * Designed to slot in alongside the existing RBAC layer — the RBAC engine
 * continues to work; we simply derive the role from the JWT payload instead
 * of a mock cookie string.
 */

import type { AppRole } from '@/lib/rbac/roles';

const AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_URL || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
const IR_URL =
  process.env.NEXT_PUBLIC_IR_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/ir';

const TOKEN_KEY = 'ir_baalvion_access_token';
const REFRESH_KEY = 'ir_baalvion_refresh_token';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IRAuthUser {
  id: string;
  email: string;
  name?: string;
  /** Maps to the existing AppRole taxonomy in src/lib/rbac/roles.ts */
  role: AppRole;
}

export interface IRLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: IRAuthUser;
}

// ─── Token refresh queue ──────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null): void {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now() + 30_000;
}

// ─── Storage helpers (SSR-safe) ───────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

function storeTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  // Also write role to the legacy mock cookie so existing middleware still works
  // during the transition period (middleware is updated separately).
  try {
    const payload = decodeJwtPayload(accessToken);
    if (payload?.role) {
      document.cookie = `baalvion_session_mock=${payload.role}; path=/; max-age=3600; samesite=lax`;
    }
  } catch {
    // Non-fatal
  }
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  document.cookie = 'baalvion_session_mock=; path=/; max-age=0';
  document.cookie = 'ir_baalvion_token=; path=/; max-age=0';
}

// ─── Auth client ──────────────────────────────────────────────────────────────

export const irAuthClient = {
  /**
   * POST /login — exchange credentials for tokens.
   */
  async login(email: string, password: string): Promise<IRAuthUser> {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const data: IRLoginResponse = await res.json();
    storeTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  /**
   * POST /logout — invalidate session, clear tokens.
   */
  async logout(): Promise<void> {
    const token = getStoredToken();
    try {
      if (token) {
        await fetch(`${AUTH_URL}/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Always clear locally
    } finally {
      clearTokens();
    }
  },

  /**
   * POST /refresh — get a fresh access token.
   */
  async refreshToken(): Promise<string | null> {
    const currentRefresh = getStoredRefreshToken();
    if (!currentRefresh) return null;

    const res = await fetch(`${AUTH_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefresh }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data: { accessToken: string; refreshToken?: string } = await res.json();
    storeTokens(data.accessToken, data.refreshToken || currentRefresh);
    return data.accessToken;
  },

  /**
   * Returns the authenticated user from the JWT payload (no round-trip needed).
   * Falls back to a remote /users/me call if the payload lacks a role.
   */
  async getCurrentUser(): Promise<IRAuthUser | null> {
    const token = await irAuthClient.getValidToken();
    if (!token) return null;

    // Attempt to read role directly from the JWT payload to avoid a round-trip
    const payload = decodeJwtPayload(token);
    if (payload?.sub && payload?.role) {
      return {
        id: payload.sub as string,
        email: (payload.email as string) || '',
        name: payload.name as string | undefined,
        role: (payload.role as AppRole) || 'public',
      };
    }

    // Fallback: fetch from auth service
    const res = await fetch(`${AUTH_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
  },

  isAuthenticated(): boolean {
    const token = getStoredToken();
    if (!token) return false;
    return !isTokenExpired(token);
  },

  getToken(): string | null {
    return getStoredToken();
  },

  async getValidToken(): Promise<string | null> {
    const token = getStoredToken();
    if (token && !isTokenExpired(token)) return token;

    if (isRefreshing) {
      return new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
    }

    isRefreshing = true;
    try {
      const newToken = await irAuthClient.refreshToken();
      processQueue(newToken);
      return newToken;
    } finally {
      isRefreshing = false;
    }
  },
};

export default irAuthClient;
