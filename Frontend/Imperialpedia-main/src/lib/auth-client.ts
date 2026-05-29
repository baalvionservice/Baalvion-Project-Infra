/**
 * Imperialpedia Auth Client — SINGLE identity authority (auth-service) via the same-origin proxy.
 *
 * SECURITY MODEL (P0 remediation):
 *  - Access token: in-memory only. NEVER localStorage/sessionStorage.
 *  - Refresh token: httpOnly `baalvion_refresh` cookie set by auth-service. Never JS-readable.
 *  - Auth calls go to the SAME-ORIGIN `/auth-bff` path (rewritten to the gateway in next.config)
 *    so the cookie flows in dev and prod with `credentials: 'include'`.
 */

const AUTH_URL = '/auth-bff';

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
  user: AuthUser;
}

export interface AuthError {
  message: string;
  statusCode?: number;
}

// ─── In-memory access token (single-flight refresh) ─────────────────────────────

let _accessToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

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
  return payload.exp * 1000 < Date.now() + 30_000;
}

// ─── Auth client ──────────────────────────────────────────────────────────────

export const authClient = {
  /** POST /login — exchange credentials for an access token (refresh rides the httpOnly cookie). */
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error: AuthError = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error((error as { error?: { message?: string } })?.error?.message || error.message || 'Login failed');
    }

    const json = await res.json();
    const data = json.data ?? json;
    _accessToken = data.accessToken ?? data.token ?? null;
    const claims = _accessToken ? decodeJwtPayload(_accessToken) : null;
    return (
      data.user ?? {
        id: String(claims?.sub ?? ''),
        email: String(claims?.email ?? email),
        name: claims?.name as string | undefined,
        role: claims?.role as string | undefined,
      }
    );
  },

  /** POST /logout — invalidate the server session, clear the in-memory token. */
  async logout(): Promise<void> {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: _accessToken
          ? { 'Content-Type': 'application/json', Authorization: `Bearer ${_accessToken}` }
          : { 'Content-Type': 'application/json' },
      });
    } catch {
      /* always clear locally */
    } finally {
      _accessToken = null;
    }
  },

  /** POST /refresh — rotate via the httpOnly cookie (single-flight). Returns null if no session. */
  async refreshToken(): Promise<string | null> {
    if (!_refreshPromise) {
      _refreshPromise = (async () => {
        try {
          const res = await fetch(`${AUTH_URL}/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!res.ok) {
            _accessToken = null;
            return null;
          }
          const json = await res.json().catch(() => ({}));
          const data = json.data ?? json;
          _accessToken = data.accessToken ?? data.token ?? null;
          return _accessToken;
        } catch {
          return null;
        } finally {
          _refreshPromise = null;
        }
      })();
    }
    return _refreshPromise;
  },

  /** GET /users/me — fetch the authenticated user profile (Bearer from memory). */
  async getCurrentUser(): Promise<AuthUser | null> {
    const token = await authClient.getValidToken();
    if (!token) return null;

    const res = await fetch(`${AUTH_URL}/users/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as AuthUser;
  },

  isAuthenticated(): boolean {
    return !!_accessToken && !isTokenExpired(_accessToken);
  },

  getToken(): string | null {
    return _accessToken;
  },

  /** Returns a valid access token, transparently refreshing via the cookie if expired. */
  async getValidToken(): Promise<string | null> {
    if (_accessToken && !isTokenExpired(_accessToken)) return _accessToken;
    return authClient.refreshToken();
  },
};

export default authClient;
