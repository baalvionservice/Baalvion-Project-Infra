/**
 * Amarisé Maison Avenue — real authentication against the Baalvion identity gateway.
 *
 * SECURITY MODEL (P0): real password validation, backend-issued session.
 *  - Access token: in-memory only (never localStorage/sessionStorage).
 *  - Refresh token: httpOnly `baalvion_refresh` cookie set by auth-service.
 *  - All calls go to the SAME-ORIGIN `/auth-bff` proxy (next.config rewrite → gateway) so the
 *    cookie flows in dev and prod.
 *
 * Replaces the previous mock login (email-only match against ADMIN_ACCOUNTS, no password,
 * frontend-only role routing).
 */
'use client';

const AUTH_URL = '/auth-bff';

export interface AmariseUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

let _accessToken: string | null = null;
let _user: AmariseUser | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function getCurrentUser(): AmariseUser | null {
  return _user;
}

export function isAuthenticated(): boolean {
  return !!_accessToken;
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob((token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function applySession(data: Record<string, any>, fallbackEmail = ''): AmariseUser {
  _accessToken = data.accessToken ?? data.token ?? null;
  const claims = _accessToken ? decodeJwt(_accessToken) : null;
  _user =
    data.user ??
    (claims
      ? {
          id: String(claims.sub ?? claims.id ?? ''),
          email: (claims.email as string) ?? fallbackEmail,
          name: claims.name as string | undefined,
          role: claims.role as string | undefined,
        }
      : { id: '', email: fallbackEmail });
  return _user!;
}

export const authClient = {
  async login(email: string, password: string): Promise<AmariseUser> {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || 'Invalid email or password.');
    }
    return applySession(json.data ?? json, email);
  },

  async register(email: string, password: string, fullName?: string): Promise<AmariseUser> {
    const res = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || 'Registration failed.');
    }
    return applySession(json.data ?? json, email);
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      /* best-effort; cookie cleared server-side */
    }
    _accessToken = null;
    _user = null;
  },

  /** Silent session restore via the httpOnly refresh cookie. Returns the user or null. */
  async bootstrap(): Promise<AmariseUser | null> {
    try {
      const res = await fetch(`${AUTH_URL}/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const json = await res.json().catch(() => ({}));
      const data = json.data ?? json;
      if (!(data.accessToken ?? data.token)) return null;
      return applySession(data);
    } catch {
      return null;
    }
  },
};
