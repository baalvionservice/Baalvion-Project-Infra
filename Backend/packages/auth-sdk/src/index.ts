import type {
  User, Organization, TeamMember, TokenPair,
  ApiResponse, Session, AuditEntry, Paginated,
} from '@baalvion/types';

// ─── API Client ───────────────────────────────────────────────────────────────

export interface BaalvionClientOptions {
  authUrl:      string;
  adminUrl?:    string;
  sessionUrl?:  string;
  oauthUrl?:    string;
  onTokenRefreshed?: (tokens: TokenPair) => void;
  onUnauthorized?:   () => void;
  getAccessToken:    () => string | null;
  getRefreshToken:   () => string | null;
  /** Phase 5B: send the HttpOnly session cookie on every request (cookie/hybrid mode). */
  withCredentials?:  boolean;
}

export class ApiError extends Error {
  constructor(
    public code:    string,
    message:        string,
    public status:  number,
    public details?: unknown,
  ) { super(message); this.name = 'ApiError'; }
}

export class BaalvionClient {
  private opts: BaalvionClientOptions;
  private refreshPromise: Promise<void> | null = null;

  constructor(opts: BaalvionClientOptions) {
    this.opts = opts;
  }

  private getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find(r => r.startsWith('baalvion-csrf='))
      ?.split('=')[1] ?? '';
  }

  private async refreshIfNeeded(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;

    const refreshToken = this.opts.getRefreshToken();
    if (!refreshToken) { this.opts.onUnauthorized?.(); return; }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${this.opts.authUrl}/refresh`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          this.opts.onUnauthorized?.();
          return;
        }
        const { data } = await res.json() as ApiResponse<TokenPair>;
        if (data) this.opts.onTokenRefreshed?.(data as TokenPair);
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(
    baseUrl: string,
    path:    string,
    options: RequestInit & { skipAuth?: boolean } = {},
  ): Promise<T> {
    const { skipAuth = false, ...fetchOpts } = options;
    const token = this.opts.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      'X-CSRF-Token': this.getCsrfToken(),
      ...fetchOpts.headers,
    };

    const credentials: RequestCredentials | undefined =
      this.opts.withCredentials ? 'include' : fetchOpts.credentials;
    const res = await fetch(`${baseUrl}${path}`, { ...fetchOpts, headers, credentials });

    if (res.status === 401 && !skipAuth) {
      await this.refreshIfNeeded();
      const newToken = this.opts.getAccessToken();
      if (!newToken) throw new ApiError('UNAUTHORIZED', 'Session expired', 401);

      const retryRes = await fetch(`${baseUrl}${path}`, {
        ...fetchOpts,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
        credentials,
      });
      if (!retryRes.ok) {
        const err = await retryRes.json() as ApiResponse<never>;
        if (!err.success) throw new ApiError(err.error.code, err.error.message, retryRes.status, err.error.details);
      }
      const retryData = await retryRes.json() as ApiResponse<T>;
      if (!retryData.success) throw new ApiError(retryData.error.code, retryData.error.message, retryRes.status);
      return retryData.data;
    }

    const json = await res.json() as ApiResponse<T>;
    if (!json.success) throw new ApiError(json.error.code, json.error.message, res.status, json.error.details);
    return json.data;
  }

  // ── Auth endpoints ───────────────────────────────────────────────────────────

  get auth() {
    const { authUrl } = this.opts;
    const r = this.request.bind(this);
    return {
      login:          (body: { email: string; password: string }) =>
        r<TokenPair & { user: User; org?: Organization; mfa_required?: boolean; challengeToken?: string }>(authUrl, '/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
      register:       (body: { email: string; password: string; fullName?: string; orgName?: string }) =>
        r<TokenPair & { user: User; org: Organization }>(authUrl, '/register', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
      logout:         () =>
        r<{ message: string }>(authUrl, '/logout', { method: 'POST' }),
      refresh:        (refreshToken: string) =>
        r<TokenPair>(authUrl, '/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }), skipAuth: true }),
      mfaChallenge:   (body: { challengeToken: string; code: string }) =>
        r<TokenPair & { user: User }>(authUrl, '/mfa/challenge', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
      me:             () =>
        r<User>(authUrl, '/me'),
      updateMe:       (body: { fullName?: string; avatarUrl?: string }) =>
        r<User>(authUrl, '/me', { method: 'PATCH', body: JSON.stringify(body) }),
      forgotPassword: (email: string) =>
        r<{ message: string }>(authUrl, '/forgot-password', { method: 'POST', body: JSON.stringify({ email }), skipAuth: true }),
      resetPassword:  (body: { token: string; newPassword: string }) =>
        r<{ message: string }>(authUrl, '/reset-password', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
      verifyEmail:    (token: string) =>
        r<{ message: string }>(authUrl, `/verify-email?token=${token}`, { skipAuth: true }),
      verifyToken:    (token: string) =>
        r<{ valid: boolean; payload?: object }>(authUrl, '/verify-token', { method: 'POST', body: JSON.stringify({ token }) }),

      sessions: {
        list:      () => r<Session[]>(authUrl, '/sessions'),
        revokeOne: (id: string) => r<{ message: string }>(authUrl, `/sessions/${id}`, { method: 'DELETE' }),
        revokeAll: () => r<{ message: string }>(authUrl, '/sessions', { method: 'DELETE' }),
      },

      auditLogs: (params?: { page?: number; limit?: number; action?: string }) =>
        r<Paginated<AuditEntry>>(authUrl, `/audit-logs?${new URLSearchParams(params as Record<string, string> ?? {})}`),

      orgs: {
        list:         () => r<Organization[]>(authUrl, '/orgs'),
        create:       (body: { name: string }) => r<Organization>(authUrl, '/orgs', { method: 'POST', body: JSON.stringify(body) }),
        members:      (orgId: string) => r<TeamMember[]>(authUrl, `/orgs/${orgId}/members`),
        invite:       (orgId: string, body: { email: string; role?: string }) =>
          r<{ message: string }>(authUrl, `/orgs/${orgId}/invite`, { method: 'POST', body: JSON.stringify(body) }),
        removeMember: (orgId: string, userId: string) =>
          r<{ message: string }>(authUrl, `/orgs/${orgId}/members/${userId}`, { method: 'DELETE' }),
        updateRole:   (orgId: string, userId: string, body: { role?: string }) =>
          r<TeamMember>(authUrl, `/orgs/${orgId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify(body) }),
      },
    };
  }
}

// ─── Token storage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'baalvion_tokens';

export interface StoredTokens {
  accessToken:  string;
  refreshToken: string;
  expiresAt:    number;
}

export const tokenStorage = {
  get(): StoredTokens | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  set(tokens: StoredTokens): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  },

  clear(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },

  isExpired(): boolean {
    const tokens = tokenStorage.get();
    if (!tokens?.expiresAt) return true;
    return Date.now() >= tokens.expiresAt - 30_000;
  },
};

// ─── Multi-mode auth resolution (Phase 5B) ──────────────────────────────────────
// NON-BREAKING layer: resolves the current session from WHATEVER auth system an app
// already uses, without removing any of them. Priority:
//   (1) HttpOnly cookie session   (future / preferred)
//   (2) localStorage Bearer token (current)
//   (3) island adapter session    (Supabase-style — read via callback, adapter UNTOUCHED)
//   (4) guest
// Output is always the canonical { userId, orgId, roles[], permissions[] }.

export type AuthMode = 'cookie' | 'localStorage' | 'island' | 'guest';

export interface CanonicalSession {
  authenticated: boolean;
  mode:          AuthMode;
  userId:        string | null;
  orgId:         string | null;
  roles:         string[];
  permissions:   string[];
  email?:        string | null;
  raw?:          unknown;
}

const GUEST_SESSION: CanonicalSession = {
  authenticated: false, mode: 'guest', userId: null, orgId: null, roles: [], permissions: [],
};

export interface AuthSessionOptions {
  /** auth-service base URL (…/v1/auth) */
  authUrl:            string;
  /** legacy localStorage token getters — current apps keep working unchanged */
  getAccessToken?:    () => string | null;
  getRefreshToken?:   () => string | null;
  setTokens?:         (t: TokenPair) => void;
  clearTokens?:       () => void;
  /** Supabase/island-adapter session reader — returns the adapter's raw session (adapter is NOT touched) */
  readIslandSession?: () => unknown | null;
  /** probe the HttpOnly cookie session via credentials:'include' /me (default true) */
  cookieMode?:        boolean;
}

/** Map ANY known session/token shape (RS256 canonical, legacy, island) into the canonical contract. */
export function toCanonicalSession(src: any, mode: AuthMode): CanonicalSession {
  if (!src) return { ...GUEST_SESSION, mode };
  const u        = src.user ?? src;
  const userId   = u.userId ?? u.sub ?? u.id ?? null;
  const orgId    = u.orgId ?? u.org_id ?? u.organizationId ?? u.tenantId ?? null;
  const rolesRaw = u.roles ?? (u.role != null ? [u.role] : []);
  const roles    = Array.isArray(rolesRaw) ? rolesRaw.map(String) : (rolesRaw ? [String(rolesRaw)] : []);
  const perms    = Array.isArray(u.permissions) ? u.permissions : [];
  return {
    authenticated: userId != null,
    mode,
    userId:      userId != null ? String(userId) : null,
    orgId:       orgId  != null ? String(orgId)  : null,
    roles,
    permissions: perms,
    email:       u.email ?? null,
    raw:         src,
  };
}

/**
 * Unified session API over the multi-mode resolver. Additive — apps opt in; nothing else changes.
 * NEVER removes Supabase/Firebase/localStorage; it READS whichever the app uses and normalizes.
 */
export function createAuthSession(opts: AuthSessionOptions) {
  const client = new BaalvionClient({
    authUrl:          opts.authUrl,
    getAccessToken:   opts.getAccessToken  ?? (() => null),
    getRefreshToken:  opts.getRefreshToken ?? (() => null),
    onTokenRefreshed: (t) => opts.setTokens?.(t),
    withCredentials:  opts.cookieMode !== false,
  });
  let cache: CanonicalSession | null = null;

  async function getSession(force = false): Promise<CanonicalSession> {
    if (cache && !force) return cache;
    // (1) HttpOnly cookie session — credentials:'include' /me (no Bearer)
    if (opts.cookieMode !== false && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(`${opts.authUrl}/me`, { credentials: 'include', headers: { 'Content-Type': 'application/json' } });
        if (res.ok) {
          const j: any = await res.json();
          const u = j?.data ?? j;
          if (u && (u.id ?? u.userId ?? u.sub)) return (cache = toCanonicalSession(u, 'cookie'));
        }
      } catch { /* fall through to next mode */ }
    }
    // (2) localStorage Bearer token — current apps
    if (opts.getAccessToken?.()) {
      try { const u = await client.auth.me(); if (u) return (cache = toCanonicalSession(u, 'localStorage')); }
      catch { /* fall through */ }
    }
    // (3) island adapter session (Supabase-style) — read via callback, map locally (no network)
    const island = opts.readIslandSession?.();
    if (island) return (cache = toCanonicalSession(island, 'island'));
    // (4) guest
    return (cache = { ...GUEST_SESSION });
  }

  async function getUser(): Promise<CanonicalSession | null> {
    const s = await getSession();
    return s.authenticated ? s : null;
  }

  async function refreshSession(): Promise<CanonicalSession> {
    cache = null;
    const rt = opts.getRefreshToken?.();
    if (rt) { try { const t = await client.auth.refresh(rt); opts.setTokens?.(t); } catch { /* cookie/island modes don't need it */ } }
    return getSession(true);
  }

  async function logout(): Promise<void> {
    try { await client.auth.logout(); } catch { /* best-effort; cookie cleared server-side */ }
    opts.clearTokens?.();
    cache = { ...GUEST_SESSION };
  }

  return { client, getSession, getUser, refreshSession, logout, toCanonical: toCanonicalSession };
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
export type { User, Organization, TeamMember, TokenPair, Session, AuditEntry, Paginated };
