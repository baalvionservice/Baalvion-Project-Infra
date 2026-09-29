'use client';

import { createGatewaySession } from '@baalvion/auth-sdk';
import { configureApi } from '@/lib/api/client';

/**
 * The browser's session, terminated in HttpOnly cookies by the platform's auth-gateway BFF.
 *
 * No access token is ever readable from JavaScript: login returns `Set-Cookie` and nothing
 * else, so an XSS on this site cannot walk away with a credential. The only JS-readable
 * cookie is the CSRF token, which is useless on its own. This is also why nothing here
 * touches localStorage — the platform's CI guard rejects auth material in web storage, and
 * it is right to.
 */
// A same-origin path, rewritten to the gateway in next.config.ts. Keeping it relative is
// what keeps the session cookie first-party — a cross-origin gateway would need
// SameSite=None, which Safari and Chrome now drop for many visitors.
const BFF = '/auth-bff';

export const session = createGatewaySession({ gatewayUrl: BFF });

// Data calls go through authFetch: it attaches the CSRF header and, on a 401, performs one
// shared refresh before retrying rather than letting every in-flight request refresh at once.
// NOTE the shape of this base. `authFetch` builds `<gatewayUrl>/api<path>` itself, so the
// path handed to it must NOT repeat the /api segment — passing '/api/canwemarry/v1' here
// produced '/auth-bff/api/api/canwemarry/v1/...' and a 404 on every page load. The URL the
// browser finally requests is '/auth-bff/api/canwemarry/v1/...', which next.config.ts
// rewrites to '<gateway>/api/canwemarry/v1/...'.
configureApi({
  baseUrl: '/canwemarry/v1',
  fetchImpl: (input, init) => session.authFetch(input, init),
});

export interface Identity {
  userId: string;
  email: string | null;
  roles: string[];
}

export async function currentIdentity(): Promise<Identity | null> {
  const s = await session.getSession();
  if (!s.authenticated || !s.userId) return null;
  return { userId: s.userId, email: s.email ?? null, roles: s.roles ?? [] };
}
