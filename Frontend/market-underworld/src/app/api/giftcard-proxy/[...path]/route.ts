import { NextRequest, NextResponse } from 'next/server';

// Same-origin bridge to giftcard-service — mirrors api/community-proxy/route.ts exactly.
const GIFTCARD_API_BASE = process.env.NEXT_PUBLIC_GIFTCARD_API_BASE ?? 'https://api.baalvion.com/api/v1/giftcards';

async function proxy(request: NextRequest, path: string[]) {
  const target = new URL(`${GIFTCARD_API_BASE}/${path.join('/')}`);
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
