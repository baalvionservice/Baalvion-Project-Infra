'use client';
/**
 * IR-Baalvion → auth-gateway (BFF) unified session, via @baalvion/auth-sdk.
 *
 * ADDITIVE + gated by NEXT_PUBLIC_BFF_MODE (default off). The legacy lib/auth-client.ts path
 * (in-memory access token + client-side JWT decode) is left UNTOUCHED for rollback. When this is
 * adopted at cutover it replaces that path entirely: no token in JS, identity comes from /auth/me
 * (never a decoded JWT), and data calls go through authFetch (cookie + CSRF + single-flight refresh).
 *
 * Cutover (post pnpm install + verification): point components at irGatewayAuth, then delete the
 * in-memory token + decodeJwtPayload logic in lib/auth-client.ts and the unverified decode in
 * lib/rbac/with-permission.ts.
 */
import { createGatewaySession } from '@baalvion/auth-sdk';
import type { AppRole } from '@/lib/rbac/roles';

export const BFF_ENABLED = process.env.NEXT_PUBLIC_BFF_MODE === 'on';

const session = createGatewaySession({ gatewayUrl: '/auth-bff' });

export interface IRAuthUser { id: string; email: string; name?: string; role: AppRole; }

// roles[0] is a TRANSITIONAL shim — the canonical roles[] → IR vocabulary (p1_institutional, …)
// mapping is RBAC-phase work, deliberately out of scope for this identity-only migration.
const toUser = (s: { userId: string | null; email?: string | null; roles: string[] }): IRAuthUser | null =>
  s.userId ? { id: s.userId, email: s.email ?? '', role: (s.roles[0] as AppRole) ?? 'public' } : null;

export const irGatewayAuth = {
  async login(email: string, password: string): Promise<IRAuthUser | null> {
    await session.login(email, password);
    return toUser(await session.getSession(true));
  },
  logout:          () => session.logout(),
  getCurrentUser:  async () => toUser(await session.getSession()),
  isAuthenticated: async () => (await session.getSession()).authenticated,
  /** Data client — cookie + CSRF + single-flight 401→refresh→retry. No Bearer, no localStorage. */
  api:             session.authFetch,
};

export default irGatewayAuth;
