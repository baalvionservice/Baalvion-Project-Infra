const BASE = import.meta.env.VITE_API_AUTH_BASE_URL || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';

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
}

async function post<T>(path: string, body: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    const msg = json?.error?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return json.data as T;
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

  register: async (
    email: string,
    password: string,
    fullName: string,
    orgName?: string,
  ): Promise<RegisterResult> => {
    const data = await post<Record<string, unknown>>('/register', {
      email,
      password,
      fullName,
      orgName: orgName || fullName + "'s Org",
    });
    return { ...normalizeTokens(data), org: data.org as AuthOrg };
  },

  logout: (token: string) => post<void>('/logout', {}, token),

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const data = await post<Record<string, unknown>>('/refresh', { refreshToken });
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
