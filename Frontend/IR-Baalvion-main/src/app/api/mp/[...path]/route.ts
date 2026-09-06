import { cookies } from 'next/headers';
import { REFRESH_COOKIE, userFromRefresh, isLocalAuthEnabled } from '@/lib/auth/local-auth';
import { resolveIdentity, type Identity } from '@/lib/auth/identity';
import { mintMarketplaceToken, devOrgForUser } from '@/lib/marketplace-auth';

// Authenticated same-origin proxy to marketplace-service. Identity comes from the auth-gateway
// and the caller's own access token is forwarded onward, so the marketplace verifies RS256
// itself and sees the user's REAL org — deal-room isolation keys on nothing else.
export const dynamic = 'force-dynamic';

const MARKETPLACE_URL = process.env.MARKETPLACE_SERVICE_URL || 'http://127.0.0.1:3060';
const IR_SERVICE_URL = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';
// `companies` is here because the marketplace is two-sided: a founder posts their business
// through this same BFF. marketplace-service still owns every rule — ownership on edit, the
// approval gate before a round can go live — so widening the allow-list widens transport only.
const ALLOWED_ROOTS = new Set(['deals', 'opportunities', 'investors', 'companies']);

/**
 * Dev-only standalone identity: the seed-user backend, given a per-user org so two local
 * accounts are two tenants. Returns null in production and whenever the opt-in is off.
 */
async function localIdentity(): Promise<Identity | null> {
  if (!isLocalAuthEnabled()) return null;
  const user = userFromRefresh((await cookies()).get(REFRESH_COOKIE)?.value);
  if (!user) return null;
  const orgId = devOrgForUser(String(user.id));
  const accessToken = mintMarketplaceToken({ sub: user.id, org: orgId, email: user.email });
  if (!accessToken) return null;
  return { userId: String(user.id), email: user.email, orgId, roles: ['investor_admin'], accessToken, setCookies: [] };
}

// Deal-room access gate: a deal may only be OPENED once the investor's IR application is approved,
// they used a corporate email, and the post-approval cool-down has elapsed. Fail-closed — if the
// eligibility service can't confirm, opening is blocked (existing deals stay reachable via GET).
async function dealRoomGate(email: string): Promise<{ ok: true } | { ok: false; body: unknown }> {
  try {
    const res = await fetch(
      `${IR_SERVICE_URL}/api/v1/applications/eligibility?email=${encodeURIComponent(email)}`,
      { cache: 'no-store' },
    );
    const json = await res.json().catch(() => null);
    const data = json?.data;
    if (res.ok && json?.success && data?.eligible) return { ok: true };
    return {
      ok: false,
      body: {
        success: false,
        error: {
          code: 'NOT_ELIGIBLE',
          reason: data?.reason || 'SERVICE_UNAVAILABLE',
          dealRoomUnlocksAt: data?.dealRoomUnlocksAt ?? null,
          cooldownMinutes: data?.cooldownMinutes ?? null,
          message: 'Deal-room access is not yet available for your account.',
        },
      },
    };
  } catch {
    return {
      ok: false,
      body: { success: false, error: { code: 'NOT_ELIGIBLE', reason: 'SERVICE_UNAVAILABLE', message: 'Could not verify deal-room eligibility. Please try again shortly.' } },
    };
  }
}

/** Replay any session cookies the gateway rotated during this request. */
function withSetCookies(res: Response, setCookies: string[]): Response {
  if (!setCookies.length) return res;
  const headers = new Headers(res.headers);
  for (const c of setCookies) headers.append('set-cookie', c);
  return new Response(res.body, { status: res.status, headers });
}

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path?.length || !ALLOWED_ROOTS.has(path[0])) {
    return Response.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const identity = (await resolveIdentity()) ?? (await localIdentity());
  if (!identity) {
    return Response.json({ success: false, error: 'Sign in as an investor to continue.' }, { status: 401 });
  }
  // An identity with no org cannot be isolated from anyone. Refuse rather than fall back to a
  // shared tenant — that is what previously made every investor's pipeline visible to all.
  if (!identity.orgId) {
    return Response.json({
      success: false,
      error: { code: 'NO_ORG', message: 'Your account is not linked to an organisation yet. Contact IR to complete investor onboarding.' },
    }, { status: 403 });
  }

  // Gate only the act of opening a new deal; viewing/managing existing deals is unaffected.
  if (req.method === 'POST' && path[0] === 'deals' && path.length === 1) {
    const gate = await dealRoomGate(identity.email);
    if (!gate.ok) return withSetCookies(Response.json(gate.body, { status: 403 }), identity.setCookies);
  }

  const url = `${MARKETPLACE_URL}/api/v1/${path.join('/')}${new URL(req.url).search}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${identity.accessToken}` };
  const init: RequestInit = { method: req.method, headers, cache: 'no-store' };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.startsWith('multipart/form-data')) {
      // Forward multipart untouched. Reading it as text and re-sending it as JSON destroyed the
      // body — data-room uploads came back 400. The boundary lives in the original content-type,
      // so that header has to be passed through verbatim, and the body streamed as bytes.
      headers['Content-Type'] = contentType;
      init.body = new Uint8Array(await req.arrayBuffer());
    } else {
      headers['Content-Type'] = 'application/json';
      init.body = await req.text();
    }
  }

  try {
    const res = await fetch(url, init);
    const body = await res.text();
    return withSetCookies(
      new Response(body, { status: res.status, headers: { 'Content-Type': 'application/json' } }),
      identity.setCookies,
    );
  } catch {
    return Response.json({ success: false, error: 'Marketplace service unavailable.' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
