'use client';
/**
 * About-Baalvion → auth-gateway (BFF) unified session, via @baalvion/auth-sdk.
 *
 * ADDITIVE + gated by NEXT_PUBLIC_BFF_MODE (default off); the app's existing auth path is left
 * untouched for rollback. At cutover this replaces it: no token in JS, identity from /auth/me,
 * data via authFetch (cookie + CSRF + single-flight refresh). Canonical roles[]/permissions[] are
 * returned as-is; mapping to any app-specific role vocabulary is RBAC-phase work.
 */
import { createGatewaySession } from '@baalvion/auth-sdk';

export const BFF_ENABLED = process.env.NEXT_PUBLIC_BFF_MODE === 'on';

const session = createGatewaySession({
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL ?? '/auth-bff',
});

export interface GatewayIdentity { id: string; email: string; roles: string[]; permissions: string[]; orgId: string | null; }

const toIdentity = (s: {
  userId: string | null; email?: string | null; roles: string[]; permissions: string[]; orgId: string | null;
}): GatewayIdentity | null =>
  s.userId ? { id: s.userId, email: s.email ?? '', roles: s.roles, permissions: s.permissions, orgId: s.orgId } : null;

export const gatewayAuth = {
  async login(email: string, password: string): Promise<GatewayIdentity | null> {
    await session.login(email, password);
    return toIdentity(await session.getSession(true));
  },
  logout:          () => session.logout(),
  getCurrentUser:  async () => toIdentity(await session.getSession()),
  isAuthenticated: async () => (await session.getSession()).authenticated,
  /** Data client — cookie + CSRF + single-flight 401→refresh→retry. No Bearer, no localStorage. */
  api:             session.authFetch,
};

export default gatewayAuth;
