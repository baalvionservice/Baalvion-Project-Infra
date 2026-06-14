import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ControlTheMarket edge middleware (P0).
 *
 * Adds an edge presence gate to complement the bootstrap-aware client guard in auth-context.
 * SECURITY MODEL: gates on the un-forgeable httpOnly `baalvion_refresh` cookie; the access token is
 * in memory and per-role authorization is enforced at the API + client. The login/signup and other
 * marketing routes stay public.
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';

// Public (no session required). Mirrors the client AuthProvider's public-path list.
const PUBLIC_PREFIXES = [
  '/login', '/signup', '/forgot-password', '/reset-password',
  '/demos', '/blog', '/badges', '/companies', '/contact',
  '/leaderboard', '/pricing', '/privacy', '/terms', '/about',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev-only mock mode (never active in production — see auth-context) has no real cookie; don't gate.
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return NextResponse.next();
  }

  const isPublic =
    pathname === '/' ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) {
    return NextResponse.next();
  }

  if (!request.cookies.get(REFRESH_COOKIE)?.value) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude API/proxy internals, Next static assets, and crawler/SEO metadata
    // routes (robots.txt, sitemap*.xml, manifest, opengraph/og images). Without
    // these exclusions the auth gate 307-redirects crawlers to /login, breaking SEO.
    // `.*\\..*` excludes any path with a file extension (mock PDFs, og-image.png, icons…) so every
    // static public/ asset bypasses the auth gate and is served directly.
    '/((?!api|auth-bff|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap-|manifest.webmanifest|opengraph-image|og-image|.*\\..*).*)',
  ],
};
