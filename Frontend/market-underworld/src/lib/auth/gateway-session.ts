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

export const gatewayAuth = {
  async login(email: string, password: string): Promise<GatewayIdentity | null> {
    await session.login(email, password);
    return toIdentity(await session.getSession(true));
  },
  register,
  logout: () => session.logout(),
  getCurrentUser: async () => toIdentity(await session.getSession()),
  isAuthenticated: async () => (await session.getSession()).authenticated,
  /** Data client — cookie + CSRF + single-flight 401→refresh→retry. No Bearer, no localStorage. */
  api: session.authFetch,
};

export default gatewayAuth;
