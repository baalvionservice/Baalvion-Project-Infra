'use client';
/**
 * company-dashboard → auth-gateway (BFF) cookie client.
 *
 * Now delegates to the unified @baalvion/auth-sdk `createGatewaySession` — the single source of
 * truth. The previously hand-rolled fork is gone; the export surface (gwLogin/gwMe/gwLogout/gwApi/
 * BFF_ENABLED) is unchanged so existing call sites need no edits. Auth is HttpOnly cookies only
 * (credentials:'include') + CSRF double-submit; no JWT is read or stored in JS. gwApi additionally
 * gains the SDK's single-flight 401→refresh→retry, which the old fork lacked.
 */
import { createGatewaySession } from '@baalvion/auth-sdk';

const GW = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3099';
export const BFF_ENABLED = process.env.NEXT_PUBLIC_BFF_MODE === 'on';

const session = createGatewaySession({ gatewayUrl: GW });

export interface GatewayUser { userId?: string; id?: string; email?: string; roles?: string[]; orgId?: string | null; permissions?: string[]; }

export async function gwLogin(email: string, password: string): Promise<GatewayUser> {
  const { user } = await session.login(email, password);
  return user as GatewayUser;
}

export async function gwMe(): Promise<GatewayUser | null> {
  const s = await session.getSession(true);
  return s.authenticated
    ? { userId: s.userId ?? undefined, email: s.email ?? undefined, roles: s.roles, orgId: s.orgId, permissions: s.permissions }
    : null;
}

export async function gwLogout(): Promise<void> {
  await session.logout();
}

export async function gwApi(path: string, init: RequestInit = {}): Promise<Response> {
  return session.authFetch(path, init);
}
