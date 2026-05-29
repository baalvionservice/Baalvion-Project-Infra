/**
 * IR-Baalvion Auth Client
 *
 * SECURITY MODEL (P0 remediation):
 *  - Access token: in-memory only. NEVER localStorage/sessionStorage.
 *  - Refresh token: httpOnly `baalvion_refresh` cookie set by auth-service. Never JS-readable.
 *  - Auth calls go to the SAME-ORIGIN `/auth-bff` path (rewritten to the gateway in next.config)
 *    so the cookie flows in dev and prod with `credentials: 'include'`.
 *  - The legacy forgeable `baalvion_session_mock` role cookie has been REMOVED — the frontend
 *    never trusts a client-written role. Role is derived from the verified access-token claims.
 */

import type { AppRole } from '@/lib/rbac/roles';

const AUTH_URL = '/auth-bff';
const IR_URL =
  process.env.NEXT_PUBLIC_IR_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/ir';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IRAuthUser {
  id: string;
  email: string;
  name?: string;
  role: AppRole;
}

export interface IRLoginResponse {
  accessToken: string;
  user: IRAuthUser;
}

// ─── In-memory access token (single-flight refresh) ─────────────────────────────

let _accessToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

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

// ─── Auth client ──────────────────────────────────────────────────────────────

export const irAuthClient = {
  /** POST /login — exchange credentials for an access token (refresh rides the httpOnly cookie). */
  async login(email: string, password: string): Promise<IRAuthUser> {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error?.error?.message || error.message || 'Login failed');
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
        role: (claims?.role as AppRole) ?? 'public',
      }
    );
  },

  /** POST /logout — invalidate the server session and clear the in-memory token. */
  async logout(): Promise<void> {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {},
      });
    } catch {
      /* always clear locally */
    } finally {
      _accessToken = null;
    }
  },

  /** POST /refresh — rotate via the httpOnly cookie (single-flight). */
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

  /** Returns the authenticated user from the in-memory access-token claims (or /users/me). */
  async getCurrentUser(): Promise<IRAuthUser | null> {
    const token = await irAuthClient.getValidToken();
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (payload?.sub && payload?.role) {
      return {
        id: payload.sub as string,
        email: (payload.email as string) || '',
        name: payload.name as string | undefined,
        role: (payload.role as AppRole) || 'public',
      };
    }

    const res = await fetch(`${AUTH_URL}/users/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as IRAuthUser;
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
    return irAuthClient.refreshToken();
  },
};

export { IR_URL };
export default irAuthClient;
