'use client';
/**
 * Market Underworld → auth-gateway (BFF) session, via @baalvion/auth-sdk.
 * Cookie-only (no JWT in JS): login/register/session all flow through the
 * same-origin /auth-bff/* proxy (see next.config.ts rewrites), which forwards
 * to the shared Baalvion identity gateway. Real accounts are created in the
 * platform's shared auth.users table — same identity system as every other
 * Baalvion property.
 */
import { createGatewaySession, ApiError } from '@baalvion/auth-sdk';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? '/auth-bff';

const session = createGatewaySession({ gatewayUrl: GATEWAY_URL });

export interface GatewayIdentity {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  orgId: string | null;
}

// Mirrors commerce-service/order-service's requirePlatformAdmin: super_admin | country_admin.
export const ADMIN_ROLES = ['super_admin', 'country_admin'];

export const isAdminIdentity = (identity: GatewayIdentity | null): boolean =>
  !!identity && identity.roles.some((r) => ADMIN_ROLES.includes(r));

const toIdentity = (s: {
  userId: string | null; email?: string | null; roles: string[]; permissions: string[]; orgId: string | null;
}): GatewayIdentity | null =>
  s.userId ? { id: s.userId, email: s.email ?? '', roles: s.roles, permissions: s.permissions, orgId: s.orgId } : null;

async function register(email: string, password: string, fullName?: string): Promise<GatewayIdentity | null> {
  const base = GATEWAY_URL.replace(/\/$/, '');
  const r = await fetch(`${base}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });
  if (!r.ok) {
    const e: any = await r.json().catch(() => ({}));
    throw new ApiError(e?.error?.code ?? 'REGISTER_FAILED', e?.error?.message ?? 'Registration failed', r.status);
  }
  return toIdentity(await session.getSession(true));
}

// Unauthenticated (skipAuth-equivalent) gateway calls — mirrors register()'s bare-fetch pattern
// exactly, since these run before a session cookie exists (or, for verifyEmail, without one).
async function gatewayPost(path: string, body: unknown): Promise<{ message: string }> {
  const base = GATEWAY_URL.replace(/\/$/, '');
  const r = await fetch(`${base}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(json?.error?.code ?? 'REQUEST_FAILED', json?.error?.message ?? 'Request failed', r.status);
  return json?.data ?? json;
}

export const gatewayAuth = {
  async login(email: string, password: string): Promise<GatewayIdentity | null> {
    await session.login(email, password);
    return toIdentity(await session.getSession(true));
  },
  register,
  logout: () => session.logout(),
  getCurrentUser: async () => toIdentity(await session.getSession()),
  isAuthenticated: async () => (await session.getSession()).authenticated,
  forgotPassword: (email: string) => gatewayPost('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => gatewayPost('/auth/reset-password', { token, newPassword }),
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const base = GATEWAY_URL.replace(/\/$/, '');
    const r = await fetch(`${base}/auth/verify-email?token=${encodeURIComponent(token)}`, { credentials: 'include' });
    const json: any = await r.json().catch(() => ({}));
    if (!r.ok) throw new ApiError(json?.error?.code ?? 'VERIFY_FAILED', json?.error?.message ?? 'Verification failed', r.status);
    return json?.data ?? json;
  },
  /** Data client — cookie + CSRF + single-flight 401→refresh→retry. No Bearer, no localStorage. */
  api: session.authFetch,
};

export default gatewayAuth;
