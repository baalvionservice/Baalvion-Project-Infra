/**
 * SERVER-ONLY. Calls ir-service on behalf of the signed-in investor.
 *
 * The investor-facing endpoints under /api/v1/* used to return hardcoded figures — a commitment,
 * a NAV, an IRR — that came from nowhere. They now proxy to ir-service, which owns the capital
 * ledgers, and forward the caller's OWN access token so ir-service verifies RS256 itself and
 * scopes every read to that investor. This app never asserts an identity it did not receive.
 *
 * Failure is explicit. If ir-service is unreachable the route returns 503 rather than a fallback
 * figure: on a capital account, a stale or invented number is worse than a visible outage.
 */
import { resolveIdentity } from '@/lib/auth/identity';
import { REFRESH_COOKIE, userFromRefresh, isLocalAuthEnabled } from '@/lib/auth/local-auth';
import { mintMarketplaceToken, devOrgForUser } from '@/lib/marketplace-auth';
import { cookies } from 'next/headers';

const IR_SERVICE_URL = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

async function bearer(): Promise<string | null> {
  const identity = await resolveIdentity();
  if (identity) return identity.accessToken;
  // Dev-only standalone path, same fail-closed guards as the marketplace proxy.
  if (!isLocalAuthEnabled()) return null;
  const user = userFromRefresh((await cookies()).get(REFRESH_COOKIE)?.value);
  if (!user) return null;
  // Carry the seed account's own role. Minting a fixed 'investor_admin' meant a dev staff account
  // could never reach the staff endpoints, so the operator surfaces were untestable locally.
  return mintMarketplaceToken({
    sub: user.id,
    org: devOrgForUser(String(user.id)),
    email: user.email,
    roles: [user.role],
  });
}

/**
 * Call ir-service as the signed-in investor and return its answer verbatim.
 *
 * `requireAuth: false` is for surfaces ir-service itself serves publicly (published documents,
 * open votes): the token is forwarded when there is one — so an authenticated caller sees their
 * org's full set — and the call still goes through when there is not.
 */
export async function irProxy(
  path: string,
  init: { method?: string; body?: string; requireAuth?: boolean } = {},
): Promise<Response> {
  const { method = 'GET', body, requireAuth = true } = init;
  const token = await bearer();
  if (!token && requireAuth) {
    return Response.json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' } }, { status: 401 });
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${IR_SERVICE_URL}/api/v1${path}`, { method, headers, body, cache: 'no-store' });
    const text = await res.text();
    return new Response(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    // Explicit outage, never a fallback figure: on an investor portal a stale or invented number
    // is worse than a visible failure.
    return Response.json(
      { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'This data is temporarily unavailable.' } },
      { status: 503 },
    );
  }
}

/** Convenience for the common authenticated read. */
export const irGet = (path: string) => irProxy(path);

/** Forward the incoming request's method and body to ir-service. */
export async function irForward(req: Request, path: string, requireAuth = true): Promise<Response> {
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();
  return irProxy(path, { method: req.method, body, requireAuth });
}
