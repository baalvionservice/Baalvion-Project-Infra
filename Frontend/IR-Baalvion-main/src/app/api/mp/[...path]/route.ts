import { cookies } from 'next/headers';
import { REFRESH_COOKIE, userFromRefresh } from '@/lib/auth/local-auth';
import { mintMarketplaceToken } from '@/lib/marketplace-auth';

// Authenticated same-origin proxy to marketplace-service. Requires an IR investor session
// (baalvion_refresh cookie); mints a short-lived RS256 token for the marketplace and
// forwards the request. Only the investor-facing surfaces are allowed through.
export const dynamic = 'force-dynamic';

const MARKETPLACE_URL = process.env.MARKETPLACE_SERVICE_URL || 'http://127.0.0.1:3062';
const ALLOWED_ROOTS = new Set(['deals', 'opportunities', 'investors']);

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (!path?.length || !ALLOWED_ROOTS.has(path[0])) {
    return Response.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const user = userFromRefresh((await cookies()).get(REFRESH_COOKIE)?.value);
  if (!user) return Response.json({ success: false, error: 'Sign in as an investor to continue.' }, { status: 401 });

  const token = mintMarketplaceToken({ sub: user.id, email: user.email });
  if (!token) return Response.json({ success: false, error: 'Marketplace auth unavailable.' }, { status: 503 });

  const url = `${MARKETPLACE_URL}/api/v1/${path.join('/')}${new URL(req.url).search}`;
  const init: RequestInit = {
    method: req.method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const body = await res.text();
    return new Response(body, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return Response.json({ success: false, error: 'Marketplace service unavailable.' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
