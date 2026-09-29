// Same-origin proxy (vite server.proxy in dev / reverse proxy in prod) so the httpOnly refresh
// cookie flows in dev and prod. NEVER an absolute cross-origin URL.
const BASE = '/auth-bff';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  status: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  role?: string;
  orgId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  user: AuthUser;
}

export interface AuthOrg {
  id: string;
  name: string;
  slug: string;
}

export interface RegisterResult extends AuthTokens {
  org: AuthOrg;
  /** The plan the new org was provisioned on (slug + display + price). */
  plan?: { slug: string; name: string; monthlyPrice: number } | null;
  /** Subscription state created at signup (e.g. 'trialing' for paid plans). */
  subscription?: { status: string; planSlug: string } | null;
  /** True when the chosen plan is paid → the UI should route to checkout. */
  requiresPayment: boolean;
}

async function post<T>(path: string, body: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include', // receive/send the httpOnly refresh cookie
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json();

  // Two envelope shapes reach this same client: auth-service-direct responses wrap the payload in
  // { success, data }; the auth-GATEWAY (which /login, /email/otp/verify, /refresh etc. actually
  // hit) returns the payload flat with no `success` key at all. Only an explicit `success: false`
  // (or a non-2xx status) is a real failure — requiring `success === true` rejected every
  // genuinely successful gateway call, since it never carries that field.
  if (!res.ok || json?.success === false) {
    const msg = json?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return (json.data ?? json) as T;
}

function normalizeTokens(data: Record<string, unknown>): AuthTokens {
  const raw = data.user as Record<string, unknown> | undefined;
  return {
    accessToken: (data.token ?? data.accessToken) as string,
    refreshToken: data.refreshToken as string,
    expiresAt: data.expiresAt as string | undefined,
    user: {
      id: String(raw?.id ?? ''),
      email: String(raw?.email ?? ''),
      fullName: String(raw?.fullName ?? raw?.name ?? ''),
      avatarUrl: (raw?.avatarUrl as string | null) ?? null,
      status: String(raw?.status ?? 'active'),
      emailVerified: Boolean(raw?.emailVerified ?? raw?.email_verified ?? false),
      mfaEnabled: Boolean(raw?.mfaEnabled ?? raw?.mfa_enabled ?? false),
      role: raw?.role as string | undefined,
      orgId: raw?.orgId as string | undefined,
    },
  };
}

export interface InviteDetails {
  email: string;
  role: string;
  orgName: string;
  expiresAt: string;
}

export const authClient = {
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const data = await post<Record<string, unknown>>('/login', { email, password });
    return normalizeTokens(data);
  },

  // Passwordless email-OTP login — step 1: email a one-time code.
  emailOtpRequest: async (
    email: string,
  ): Promise<{ sentTo: string; expiresAt: string; resendAvailableInSeconds: number }> => {
    return post('/email/otp/request', { email });
  },

  // Step 2: exchange the code for a session (sets the httpOnly refresh cookie + returns tokens).
  emailOtpVerify: async (email: string, code: string): Promise<AuthTokens> => {
    const data = await post<Record<string, unknown>>('/email/otp/verify', { email, code });
    return normalizeTokens(data);
  },

  register: async (
    email: string,
    password: string,
    fullName: string,
    plan?: string,
    orgName?: string,
  ): Promise<RegisterResult> => {
    const data = await post<Record<string, unknown>>('/register', {
      email,
      password,
      fullName,
      plan: plan || undefined,
      orgName: orgName || fullName + "'s Workspace",
    });
    return {
      ...normalizeTokens(data),
      org: data.org as AuthOrg,
      plan: (data.plan as RegisterResult['plan']) ?? null,
      subscription: (data.subscription as RegisterResult['subscription']) ?? null,
      requiresPayment: Boolean(data.requiresPayment),
    };
  },

  logout: (token: string) => post<void>('/logout', {}, token),

  // Cookie-based refresh (no body): the httpOnly refresh cookie is presented automatically.
  refresh: async (): Promise<{ accessToken: string }> => {
    const data = await post<Record<string, unknown>>('/refresh', {});
    return { accessToken: String(data.accessToken ?? data.token ?? '') };
  },

  // GET /me — resolve the profile from the gateway's own access cookie (session restore).
  // The gateway reads the cookie itself, not this header; kept for defence-in-depth in case a
  // future deploy switches it to Authorization-based auth.
  me: async (token: string): Promise<AuthUser> => {
    const res = await fetch(`${BASE}/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok || json?.success === false) throw new Error(json?.error?.message || 'Failed to load profile');
    return normalizeTokens({ user: json.data ?? json.user }).user;
  },

  // SSO hand-off from the shared auth.baalvion.com sign-in surface: exchanges its raw
  // central-identity access token (verified cryptographically server-side) for a real gateway
  // session on THIS site, so a page reload restores it the same way native login does.
  ssoExchange: async (centralAccessToken: string): Promise<AuthTokens> => {
    const data = await post<Record<string, unknown>>('/sso/exchange', { accessToken: centralAccessToken });
    return normalizeTokens(data);
  },

  // Same exchange, but via a one-time hand-off CODE instead of the raw token (e.g. the "Open
  // Admin" button on admin.baalvion.com) — the code is inert on its own; auth-gateway resolves it
  // server-side to the real token before verifying, see POST /auth/sso/code + /auth/sso/exchange.
  ssoExchangeCode: async (code: string): Promise<AuthTokens> => {
    const data = await post<Record<string, unknown>>('/sso/exchange', { code });
    return normalizeTokens(data);
  },

  validateInvite: async (token: string): Promise<InviteDetails> => {
    const res = await fetch(`${BASE}/validate-invite?token=${encodeURIComponent(token)}`);
    const json = await res.json();
    if (!res.ok || !json.success)
      throw new Error(json?.error?.message || 'Invalid or expired invitation');
    return json.data as InviteDetails;
  },

  acceptInvite: async (
    token: string,
    email: string,
    password: string,
    fullName: string,
  ): Promise<AuthTokens> => {
    const data = await post<Record<string, unknown>>('/accept-invite', {
      token,
      email,
      password,
      fullName,
    });
    return normalizeTokens(data);
  },
};
