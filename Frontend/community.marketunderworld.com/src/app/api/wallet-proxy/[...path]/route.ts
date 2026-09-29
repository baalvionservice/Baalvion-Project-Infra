import { NextRequest, NextResponse } from 'next/server';

// Same-origin bridge to wallet-service — mirrors api/giftcard-proxy/route.ts exactly. Targets the
// auth-gateway's /api/wallets alias (Backend/services/identity/auth-gateway/routes/proxy.js),
// which forwards to wallet-service's own /api/v1/wallets/* controller root.
const WALLET_API_BASE = process.env.NEXT_PUBLIC_WALLET_API_BASE ?? 'https://api.baalvion.com/api/wallets';

async function proxy(request: NextRequest, path: string[]) {
  const target = new URL(`${WALLET_API_BASE}/${path.join('/')}`);
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
