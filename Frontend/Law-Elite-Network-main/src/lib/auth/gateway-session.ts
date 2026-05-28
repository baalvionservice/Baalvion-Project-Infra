'use client';
/**
 * Law-Elite-Network → auth-gateway (BFF) unified session, via @baalvion/auth-sdk.
 *
 * ADDITIVE + gated by NEXT_PUBLIC_BFF_MODE (default off). Law-Elite is a Firebase auth ISLAND;
 * this module does NOT touch the Firebase client. At cutover it replaces Firebase login with the
 * gateway (no token in JS, identity from /auth/me, data via authFetch) — gated on Law-Elite users
 * existing in the canonical auth store. Canonical roles[]/permissions[] returned as-is.
 */
import { createGatewaySession } from '@baalvion/auth-sdk';

export const BFF_ENABLED = process.env.NEXT_PUBLIC_BFF_MODE === 'on';

const session = createGatewaySession({
  gatewayUrl: process.env.NEXT_PUBLIC_GATEWAY_URL ?? '/auth-bff',
});

export interface GatewayIdentity { id: string; email: string; roles: string[]; permissions: string[]; orgId: string | null; }

const toIdentity = (s: {
  userId: string | null; email: string | null; roles: string[]; permissions: string[]; orgId: string | null;
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
