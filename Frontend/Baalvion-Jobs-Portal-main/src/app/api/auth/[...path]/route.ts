import { NextRequest, NextResponse } from 'next/server';

/**
 * Same-origin BFF proxy to the Baalvion auth-service.
 *
 * The frontend calls `/api/auth/*` (NEXT_PUBLIC_AUTH_URL=/api/auth); this handler forwards
 * to the auth-service, preserving cookies and body. It rewrites the refresh cookie's
 * `Secure` attribute away in local http dev so the browser will actually store it
 * (auth-service runs NODE_ENV=production → Secure cookies that http://localhost rejects).
 *
 * In production this proxy is a no-op cookie-wise (HTTPS), and the upstream is the gateway.
 */
const AUTH_UPSTREAM =
  process.env.AUTH_SERVICE_URL || 'http://localhost:3001/v1/auth';

const IS_HTTPS = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');

async function proxy(req: NextRequest, path: string[]) {
  const suffix = path.join('/');
  const search = req.nextUrl.search || '';
  const url = `${AUTH_UPSTREAM}/${suffix}${search}`;

  const headers: Record<string, string> = {};
  const ct = req.headers.get('content-type');
  if (ct) headers['content-type'] = ct;
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;
  const auth = req.headers.get('authorization');
  if (auth) headers['authorization'] = auth;
  const csrf = req.headers.get('x-csrf-token');
  if (csrf) headers['x-csrf-token'] = csrf;

  const method = req.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await req.text();

  let upstream: Response;
  try {
    upstream = await fetch(url, { method, headers, body, redirect: 'manual' });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: { message: 'Auth service unreachable' } },
      { status: 502 },
    );
  }

  const payload = await upstream.text();
  const res = new NextResponse(payload, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  });

  // Forward Set-Cookie(s), stripping Secure for local http dev so the cookie persists.
  const setCookies =
    typeof (upstream.headers as any).getSetCookie === 'function'
      ? (upstream.headers as any).getSetCookie()
      : upstream.headers.get('set-cookie')
        ? [upstream.headers.get('set-cookie') as string]
        : [];
  for (const c of setCookies) {
    const rewritten = IS_HTTPS ? c : c.replace(/;\s*Secure/gi, '');
    res.headers.append('set-cookie', rewritten);
  }
  return res;
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params.path);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params.path);
}
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params.path);
}
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params.path);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx.params.path);
}
