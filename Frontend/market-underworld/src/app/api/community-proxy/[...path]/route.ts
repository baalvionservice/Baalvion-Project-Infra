import { NextRequest, NextResponse } from 'next/server';

// Same-origin bridge to community-service. This app's auth is cookie-only (no JWT ever
// reaches browser JS — see lib/auth/gateway-session.ts) but community-service's authMiddleware
// expects a Bearer RS256 token, so this route reads the same httpOnly access_token cookie
// oauth-bridge/route.ts uses and forwards it as Bearer — the ONE place that translation
// happens, so every client component just calls same-origin /api/community-proxy/* with
// ordinary same-origin fetch (cookie sent automatically), same shape whether or not the
// caller is signed in (public reads work with no cookie at all).
const COMMUNITY_API_BASE = process.env.NEXT_PUBLIC_COMMUNITY_API_BASE ?? 'https://api.baalvion.com/api/v1/community';

async function proxy(request: NextRequest, path: string[]) {
  const target = new URL(`${COMMUNITY_API_BASE}/${path.join('/')}`);
  request.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));

  const headers = new Headers();
  headers.set('content-type', 'application/json');
  const accessToken = request.cookies.get('access_token')?.value;
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const upstream = await fetch(target.toString(), {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
