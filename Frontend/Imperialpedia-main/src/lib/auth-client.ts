/**
 * Imperialpedia Auth Client
 * Handles JWT authentication against proxy-backend at :4000/v1/auth
 */

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000/v1/auth';
const TOKEN_KEY = 'imperialpedia_access_token';
const REFRESH_KEY = 'imperialpedia_refresh_token';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  avatar?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}

// ─── Token refresh queue (prevents concurrent 401 storms) ────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null): void {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
}

// ─── JWT helpers ─────────────────────────────────────────────────────────────

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
  // Add 30s buffer so we refresh before the token actually expires
  return payload.exp * 1000 < Date.now() + 30_000;
}

// ─── Storage helpers (SSR safe) ───────────────────────────────────────────────

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
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Auth client ──────────────────────────────────────────────────────────────

export const authClient = {
  /**
   * POST /login — exchange credentials for tokens, store them, return user.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error: AuthError = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await res.json();
    storeTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  /**
   * POST /logout — invalidate server session, clear local tokens.
   */
  async logout(): Promise<void> {
    const token = getStoredToken();
    try {
      if (token) {
        await fetch(`${AUTH_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Always clear tokens even if the server request fails
    } finally {
      clearTokens();
    }
  },

  /**
   * POST /refresh — exchange refresh token for a new access token.
   * Returns null if the refresh token is missing or invalid.
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
    const newRefresh = data.refreshToken || currentRefresh;
    storeTokens(data.accessToken, newRefresh);
    return data.accessToken;
  },

  /**
   * GET /users/me — fetch the authenticated user profile.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const token = await authClient.getValidToken();
    if (!token) return null;

    const res = await fetch(`${AUTH_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;
    return res.json();
  },

  /**
   * Returns true when a non-expired access token is present in localStorage.
   */
  isAuthenticated(): boolean {
    const token = getStoredToken();
    if (!token) return false;
    return !isTokenExpired(token);
  },

  /**
   * Returns the raw stored access token (may be expired — use getValidToken
   * when you need a guaranteed-fresh token before an API call).
   */
  getToken(): string | null {
    return getStoredToken();
  },

  /**
   * Returns a valid access token, transparently refreshing if expired.
   * Queues concurrent refresh requests so only one refresh call is made.
   */
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
      const newToken = await authClient.refreshToken();
      processQueue(newToken);
      return newToken;
    } finally {
      isRefreshing = false;
    }
  },
};

export default authClient;
