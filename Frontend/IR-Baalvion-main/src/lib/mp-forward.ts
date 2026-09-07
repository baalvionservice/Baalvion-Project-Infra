/**
 * SERVER-ONLY. Forwards a request to marketplace-service as the signed-in caller.
 *
 * Extracted from the /api/mp/[...path] proxy so specific routes (the staff review queue) can be
 * mounted at their own paths without widening the catch-all's allow-list. Same identity rule:
 * the caller's own token is forwarded and marketplace-service decides what they may do.
 */
import { resolveIdentity } from '@/lib/auth/identity';
import { REFRESH_COOKIE, userFromRefresh, isLocalAuthEnabled } from '@/lib/auth/local-auth';
import { mintMarketplaceToken, devOrgForUser } from '@/lib/marketplace-auth';
import { cookies } from 'next/headers';

const MARKETPLACE_URL = process.env.MARKETPLACE_SERVICE_URL || 'http://127.0.0.1:3060';

async function bearer(): Promise<string | null> {
  const identity = await resolveIdentity();
  if (identity) return identity.accessToken;
  if (!isLocalAuthEnabled()) return null;
  const user = userFromRefresh((await cookies()).get(REFRESH_COOKIE)?.value);
  if (!user) return null;
  return mintMarketplaceToken({ sub: user.id, org: devOrgForUser(String(user.id)), email: user.email, // A dev seed account with an admin role stands in for platform staff, so the cross-org
    // review queue is reachable locally. Production roles come from the real token.
    roles: user.role === 'admin' ? ['platform_admin', 'admin'] : [user.role] });
}

export async function forward(req: Request, path: string): Promise<Response> {
  const token = await bearer();
  if (!token) {
    return Response.json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' } }, { status: 401 });
  }
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();
  const search = new URL(req.url).search;
  try {
    const res = await fetch(`${MARKETPLACE_URL}/api/v1${path}${search}`, {
      method: req.method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });
    return new Response(await res.text(), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return Response.json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Marketplace service unavailable.' } }, { status: 502 });
  }
}
