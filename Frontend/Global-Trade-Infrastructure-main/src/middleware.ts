import { NextRequest, NextResponse } from 'next/server';
import { isAdminPath, needsAuth } from '@/lib/route-access';
import { safeInternalPath } from '@/lib/safe-redirect';

/**
 * SECURITY MODEL (P0 remediation): the access token is in memory and not visible to the edge, so
 * this gates on the un-forgeable httpOnly `refresh_token` cookie set by trade-service. The old
 * forgeable base64-JSON `baalvion_trade_session` role cookie is NO LONGER read or trusted.
 *
 * The edge proves a SESSION exists. The SPECIFIC authority (who may see /governance, /financials,
 * etc.) is enforced by two layers the edge can't reach: the client `RouteGuard` (persona allowlist)
 * and the API (authoritative). Route classification lives in `@/lib/route-access` so the edge and
 * the guard share one source of truth and can never drift.
 */
const AUTH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';

/**
 * Hosts that serve the public World Shipping Directory as their own site. The directory
 * lives at /shipping-directory in this app; on its own subdomain it is rewritten to the
 * site root so its URLs read as ships.example.com/companies/maersk rather than exposing
 * the internal path. Configure per environment with SHIPPING_DIRECTORY_HOSTS (comma
 * separated); the defaults cover local development.
 */
const SHIPPING_DIRECTORY_PREFIX = '/shipping-directory';
const SHIPPING_DIRECTORY_HOSTS = (process.env.SHIPPING_DIRECTORY_HOSTS || 'ships.localhost,shipping.localhost')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function isDirectoryHost(request: NextRequest): boolean {
  const host = (request.headers.get('host') || '').toLowerCase().split(':')[0];
  return host.length > 0 && SHIPPING_DIRECTORY_HOSTS.includes(host);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Subdomain -> route group. Done before the auth gate because every directory route is
  // anonymous; rewriting after it would make the gate judge the pre-rewrite path.
  if (isDirectoryHost(request) && !pathname.startsWith('/_next') && !pathname.startsWith('/api/')) {
    if (pathname.startsWith(SHIPPING_DIRECTORY_PREFIX)) {
      // Canonical URL on this host omits the prefix; keep one address per page.
      const canonical = request.nextUrl.clone();
      canonical.pathname = pathname.slice(SHIPPING_DIRECTORY_PREFIX.length) || '/';
      return NextResponse.redirect(canonical);
    }
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = `${SHIPPING_DIRECTORY_PREFIX}${pathname === '/' ? '' : pathname}`;
    const res = secureHeaders(NextResponse.rewrite(rewritten), request);

    /**
     * Let a CDN hold these pages.
     *
     * The directory is anonymous reference content that only changes when the ingest
     * re-runs, so a shared cache can serve it for a long time — and it has to, because the
     * origin is a 2-vCPU box and the site is ~99,700 crawlable URLs.
     *
     * `s-maxage` targets shared caches only; a browser still revalidates on its own
     * schedule. NOTE: Cloudflare does NOT cache HTML on the strength of this header alone —
     * it also needs a Cache Rule for the hostname (Eligible for cache, Edge TTL: respect
     * origin). Without the rule this header is inert and every crawler hit reaches the box.
     */
    res.headers.set(
      'Cache-Control',
      'public, s-maxage=604800, stale-while-revalidate=86400',
    );

    /**
     * Make the response actually cacheable by Cloudflare.
     *
     * Next's App Router sets `Vary: rsc, next-router-state-tree, …` for RSC negotiation,
     * and **Cloudflare only caches on `Vary: Accept-Encoding`** — any other value makes a
     * response ineligible, which showed up as cf-cache-status: DYNAMIC on every HTML hit
     * even with a Cache Rule in place.
     *
     * Safe to narrow because Next distinguishes RSC requests by URL, not only by header:
     * they carry `?_rsc=<hash>`, so a CDN cache keyed on URL never confuses an RSC payload
     * with a document. RSC requests are additionally marked no-store here so an edge never
     * holds one at all.
     */
    if (request.headers.get('rsc') || request.nextUrl.searchParams.has('_rsc')) {
      res.headers.set('Cache-Control', 'private, no-store');
    } else {
      res.headers.set('Vary', 'Accept-Encoding');
    }
    return res;
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/trade-bff') || // same-origin auth/data proxy must be reachable
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  // Every protected surface (operational OR governance) requires an authenticated session at the
  // edge. Per-authority checks happen in the RouteGuard + API.
  if (isAdminPath(pathname) || needsAuth(pathname)) {
    if (!isAuthenticated) {
      const back = safeInternalPath(pathname, '/dashboard');
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(back)}`, request.url));
    }
    return secureHeaders(NextResponse.next(), request);
  }

  // Already authenticated and hitting /login: send them on. The redirect target is validated to be
  // same-origin (open-redirect / CWE-601 defense) before we trust it.
  if (pathname === '/login' && isAuthenticated) {
    const target = safeInternalPath(request.nextUrl.searchParams.get('redirect'), '/dashboard');
    return NextResponse.redirect(new URL(target, request.url));
  }

  return secureHeaders(NextResponse.next(), request);
}

function secureHeaders(response: NextResponse, _request: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV !== 'production';

  // Content-Security-Policy. `script-src` keeps 'unsafe-inline' (and 'unsafe-eval' in dev) because
  // Next.js injects inline bootstrap/hydration scripts; the high-value clamps are object-src 'none',
  // base-uri 'self', and frame-ancestors 'none' (clickjacking). Nonce-based script-src is the next
  // hardening step but requires per-request nonce plumbing.
  const csp = [
    "default-src 'self'",
    // Payment gateways: Razorpay Checkout.js + Stripe.js load as scripts; their hosted widgets run
    // in iframes (frame-src); PayU is a top-level form-POST (form-action).
    // static.cloudflareinsights.com: when a host sits behind the Cloudflare proxy with Web
    // Analytics on, Cloudflare INJECTS its beacon into the HTML. Without it in script-src
    // that injected script is refused on every page load — 80 CSP violations across the
    // directory the moment proxying was switched on.
    `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://js.stripe.com https://static.cloudflareinsights.com${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    // cloudflareinsights.com is where that beacon POSTs its measurements.
    `connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://api.stripe.com https://cloudflareinsights.com${isDev ? ' ws: wss:' : ''}`,
    "frame-src https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://js.stripe.com https://*.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self' https://*.payu.in https://secure.payu.in https://test.payu.in https://checkout.stripe.com",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (!isDev) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
