import { NextRequest, NextResponse } from 'next/server';

// Shared same-origin proxy-bridge factory for commerce-service/order-service. Mirrors the
// community-proxy/giftcard-proxy pattern (read the httpOnly access_token cookie server-side,
// forward as Bearer — client JS never touches tokens) but both commerce-proxy and order-proxy
// additionally need PATCH (missing from every existing proxy) and a multipart pass-through for
// product-media upload, which the text()-based community/giftcard proxies cannot carry — hence a
// shared helper here rather than copy-pasting this extra branching into two near-identical files.
const BINARY_RESPONSE_PREFIXES = ['image/', 'video/', 'application/octet-stream'];

const SENSITIVE_KEYS = /^(password_?hash|mfa_?secret|secret|refresh_?token|access_?token)$/i;
// Drops credential fields from any JSON an upstream returns, so a service that over-shares cannot leak them to a browser.
function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([k]) => !SENSITIVE_KEYS.test(k)).map(([k, v]) => [k, scrub(v)]));
  }
  return value;
}

export function createProxy(apiBase: string, opts: { edgeKey?: boolean; scrub?: boolean } = {}) {
  return async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
    const target = new URL(`${apiBase}/${path.join('/')}`);
    request.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));

    const headers = new Headers();
    const accessToken = request.cookies.get('access_token')?.value;
    if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
    // The edge only routes the signed-in commerce API for requests that come from this site's own server; it checks this
    // key and strips it. The service still verifies the login and the role, so the key alone grants nothing.
    if (opts.edgeKey && process.env.COMMUNITY_ADMIN_EDGE_KEY) headers.set('x-edge-key', process.env.COMMUNITY_ADMIN_EDGE_KEY);
    // Guest cart ownership (order-service's optionalAuth routes) rides on a signed X-Cart-Session
    // header, not a cookie — forward it through untouched when the client sent one.
    const cartSession = request.headers.get('x-cart-session');
    if (cartSession) headers.set('x-cart-session', cartSession);

    const hasBody = !['GET', 'HEAD'].includes(request.method);
    const requestContentType = request.headers.get('content-type') ?? '';
    const isMultipart = requestContentType.startsWith('multipart/');

    let body: BodyInit | undefined;
    if (hasBody && isMultipart) {
      // Stream the raw multipart body through as-is — text() would corrupt binary file bytes
      // and drop the boundary. This is the one place this proxy must diverge from the
      // text()-based community/giftcard template.
      headers.set('content-type', requestContentType);
      body = request.body ?? undefined;
    } else if (hasBody) {
      headers.set('content-type', 'application/json');
      body = await request.text();
    }

    const upstream = await fetch(target.toString(), {
      method: request.method,
      headers,
      body,
      // Node's fetch (undici) requires duplex:'half' when the request body is a stream.
      ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
    } as RequestInit);

    const responseContentType = upstream.headers.get('content-type') ?? '';
    if (BINARY_RESPONSE_PREFIXES.some((prefix) => responseContentType.startsWith(prefix))) {
      return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: { 'content-type': responseContentType },
      });
    }

    let responseBody = await upstream.text();
    if (opts.scrub && responseContentType.includes('json')) {
      try { responseBody = JSON.stringify(scrub(JSON.parse(responseBody))); } catch { /* not JSON after all: pass it through */ }
    }
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: { 'content-type': responseContentType || 'application/json' },
    });
  };
}

type RouteParams = { params: Promise<{ path: string[] }> };

// Route files call this once per HTTP verb they need to support — keeps each route.ts file's
// exports self-documenting (which verbs it actually allows) while sharing the proxy logic above.
export function proxyMethod(proxy: (request: NextRequest, path: string[]) => Promise<NextResponse>) {
  return async (request: NextRequest, { params }: RouteParams) => proxy(request, (await params).path);
}
