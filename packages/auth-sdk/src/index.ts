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

    const res = await fetch(`${baseUrl}${path}`, { ...fetchOpts, headers });

    if (res.status === 401 && !skipAuth) {
      await this.refreshIfNeeded();
      const newToken = this.opts.getAccessToken();
      if (!newToken) throw new ApiError('UNAUTHORIZED', 'Session expired', 401);

      const retryRes = await fetch(`${baseUrl}${path}`, {
        ...fetchOpts,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
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

// ─── Re-exports ───────────────────────────────────────────────────────────────
export type { User, Organization, TeamMember, TokenPair, Session, AuditEntry, Paginated };
