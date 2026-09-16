import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Same-origin proxy to the auth-gateway BFF.
 *
 * This replaces what would otherwise be a `rewrites()` entry, for one deployment reason:
 * Next resolves rewrite destinations at BUILD time and writes them into
 * routes-manifest.json. A container built once and promoted through environments would
 * therefore keep pointing at whatever gateway the build machine happened to name, and
 * changing GATEWAY_ORIGIN at deploy time would silently do nothing. Reading the variable
 * per request makes it a genuine runtime setting.
 *
 * It is not an open proxy: the destination host comes only from GATEWAY_ORIGIN, and the
 * incoming path is appended to it. Nothing a caller sends can redirect it elsewhere.
 *
 * Cookies must survive in BOTH directions — the request carries the session in, and
 * `Set-Cookie` carries a new session back out on login and refresh — so those headers are
 * forwarded explicitly rather than left to the default filtering.
 */
const GATEWAY_ORIGIN = process.env.GATEWAY_ORIGIN ?? 'http://localhost:3099';
const GATEWAY = new URL(GATEWAY_ORIGIN);

/**
 * Path prefix carried by GATEWAY_ORIGIN, if any — empty for a bare origin.
 *
 * The gateway is not always mounted at the root. Locally it is (`http://localhost:3099`), but
 * from outside the compose network it is only reachable through the namespaced carve-out at
 * `https://api.baalvion.com/api/v1/identity/auth/v1`. Building the target against the origin
 * alone silently dropped that prefix and sent every call to `/auth/login` on the bare host,
 * which 404s — so a Vercel deployment could never reach the gateway at all.
 */
const BASE_PATH = GATEWAY.pathname.replace(/\/+$/, '');

// Hop-by-hop and host-specific headers that must not be replayed upstream.
const STRIP_REQUEST = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade',
  'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'content-length',
]);

const STRIP_RESPONSE = new Set([
  'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'content-encoding', 'content-length',
]);

/**
 * Build the upstream URL from path segments that a caller controls.
 *
 * Empty segments are dropped and each remaining one is re-encoded, because a request to
 * `/auth-bff//evil.example/x` arrives as ['', 'evil.example', 'x'] and naively joining it
 * yields the protocol-relative `//evil.example/x` — which `new URL` resolves against ANY
 * base by replacing the host. That is a server-side request forgery, and this route holds
 * the visitor's session cookies. The origin is asserted afterwards as a second check, so a
 * future edit to the joining logic cannot quietly reintroduce it — and the result must still
 * sit under BASE_PATH, so a caller cannot climb out of the gateway's namespace onto another
 * surface of the same host.
 */
function buildTarget(path: string[], search: string): URL | null {
  const safe = path.filter((segment) => segment.length > 0).map(encodeURIComponent).join('/');
  const target = new URL(`${BASE_PATH}/${safe}${search}`, GATEWAY);
  return target.origin === GATEWAY.origin && target.pathname.startsWith(`${BASE_PATH}/`)
    ? target
    : null;
}

async function forward(request: NextRequest, path: string[]) {
  const target = buildTarget(path, request.nextUrl.search);
  if (!target) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request path.', details: {} } },
      { status: 400 },
    );
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIP_REQUEST.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = !['GET', 'HEAD'].includes(request.method);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      // A 302 from the gateway is meaningful to the browser; following it here would
      // swallow the redirect and return the wrong body.
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'GATEWAY_UNREACHABLE', message: 'The service is not reachable right now.', details: {} } },
      { status: 502 },
    );
  }

  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE.has(key.toLowerCase()) && key.toLowerCase() !== 'set-cookie') out.set(key, value);
  });
  // getSetCookie preserves multiple Set-Cookie headers, which a plain get() would collapse
  // into one malformed value — and the session is usually more than one cookie.
  for (const cookie of upstream.headers.getSetCookie?.() ?? []) out.append('set-cookie', cookie);

  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

type Ctx = { params: Promise<{ path: string[] }> };

const handler = async (request: NextRequest, ctx: Ctx) => forward(request, (await ctx.params).path);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
