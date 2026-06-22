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
  name?: string;          // normalized from the backend's `fullName`
  role?: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  status?: string;
  orgId?: string;
}

let _accessToken: string | null = null;
let _user: AmariseUser | null = null;

/** Normalize a backend user object (which uses `fullName`) into the AmariseUser shape. */
function normalizeUser(raw: Record<string, any>, fallbackEmail = ''): AmariseUser {
  return {
    id: String(raw.id ?? raw.sub ?? ''),
    email: raw.email ?? fallbackEmail,
    name: raw.fullName ?? raw.name ?? undefined,
    role: raw.role ?? undefined,
    avatarUrl: raw.avatarUrl ?? null,
    emailVerified: raw.emailVerified,
    mfaEnabled: raw.mfaEnabled,
    status: raw.status,
    orgId: raw.orgId,
  };
}

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
  const raw = data.user ?? (claims ?? {});
  _user = normalizeUser(raw, (claims?.email as string) ?? fallbackEmail);
  return _user;
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

  /** Passwordless login — step 1: email a one-time code. */
  async emailOtpRequest(email: string): Promise<{ sentTo: string; expiresAt: string; resendAvailableInSeconds: number }> {
    const res = await fetch(`${AUTH_URL}/email/otp/request`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || 'Could not send your login code. Please try again.');
    }
    return json.data ?? json;
  },

  /** Step 2: exchange the code for a session (sets the httpOnly refresh cookie). */
  async emailOtpVerify(email: string, code: string): Promise<AmariseUser> {
    const res = await fetch(`${AUTH_URL}/email/otp/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || 'That code is incorrect or expired.');
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

  /**
   * Request a password-reset email. The backend always responds 200 with a
   * neutral message (it never reveals whether the email is registered), so this
   * resolves on success and returns that message for display.
   */
  async forgotPassword(email: string): Promise<string> {
    const res = await fetch(`${AUTH_URL}/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || 'Unable to send the reset email. Please try again.');
    }
    return json?.data?.message || 'If that email exists, a reset link was sent.';
  },

  /** Complete a password reset using the token from the emailed link. */
  async resetPassword(token: string, newPassword: string): Promise<string> {
    const res = await fetch(`${AUTH_URL}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || 'This reset link is invalid or has expired.');
    }
    return json?.data?.message || 'Your password has been reset.';
  },

  /** Fetch the canonical current user from /me. Requires a live access token. */
  async me(): Promise<AmariseUser | null> {
    if (!_accessToken) return null;
    const res = await fetch(`${AUTH_URL}/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${_accessToken}` },
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    const data = json.data ?? json;
    _user = normalizeUser(data.user ?? data, _user?.email ?? '');
    return _user;
  },

  /** Update the current user's editable profile fields (fullName, avatarUrl). */
  async updateMe(patch: { fullName?: string; avatarUrl?: string }): Promise<AmariseUser> {
    if (!_accessToken) throw new Error('You are not signed in.');
    const res = await fetch(`${AUTH_URL}/me`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_accessToken}` },
      body: JSON.stringify(patch),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json?.error?.message || 'Could not save your changes.');
    }
    const data = json.data ?? json;
    _user = normalizeUser(data.user ?? data, _user?.email ?? '');
    return _user;
  },

  /** List the current user's active sessions. */
  async listSessions(): Promise<any[]> {
    if (!_accessToken) return [];
    const res = await fetch(`${AUTH_URL}/sessions`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${_accessToken}` },
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const data = json.data ?? json;
    return Array.isArray(data) ? data : data.sessions ?? [];
  },

  /** Revoke a single session by id (sign out that device). */
  async revokeSession(sessionId: string): Promise<void> {
    if (!_accessToken) return;
    await fetch(`${AUTH_URL}/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { Authorization: `Bearer ${_accessToken}` },
    });
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
