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
  // '/auth' is the shared-auth SSO landing (/auth/sso-callback). It MUST stay public:
  // CTM is cross-apex (controlthemarket.com), so a returning user has no .baalvion.com
  // refresh cookie yet — gating it would bounce them to /login before the token stashes.
  '/auth',
  '/demos', '/blog', '/badges', '/companies', '/contact',
  '/leaderboard', '/pricing', '/privacy', '/terms', '/about',
];

// `(public)/candidate/[id]` and `(public)/company/[id]` are PUBLIC, crawlable profile
// pages — but they share the `/candidate/` and `/company/` URL prefixes with the gated
// `(app)/candidate/*` and `(app)/company/*` workspaces. We therefore allow ONLY a single
// non-reserved segment (the profile id) and keep every named private subpath gated.
// This fails CLOSED: anything not provably a public profile id stays behind the auth gate.
const RESERVED_PRIVATE_SEGMENTS: Record<'candidate' | 'company', readonly string[]> = {
  candidate: ['dashboard', 'profile', 'rankings', 'submissions', 'tasks', 'live-session'],
  company: [
    'analytics', 'billing', 'compare', 'dashboard', 'feedback', 'invoices',
    'live-session', 'onboarding', 'recordings', 'settings', 'submissions',
    'subscription', 'tasks', 'usage',
  ],
};

function isPublicEntityProfile(pathname: string): boolean {
  const match = pathname.match(/^\/(candidate|company)\/([^/]+)\/?$/);
  if (!match) return false; // deeper paths (e.g. /candidate/submissions/[id]) stay gated
  const kind = match[1] as 'candidate' | 'company';
  const segment = match[2];
  return !RESERVED_PRIVATE_SEGMENTS[kind].includes(segment);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dev-only mock mode (never active in production — see auth-context) has no real cookie; don't gate.
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return NextResponse.next();
  }

  const isPublic =
    pathname === '/' ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    isPublicEntityProfile(pathname);
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
