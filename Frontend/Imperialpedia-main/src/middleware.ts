import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Imperialpedia middleware — single source of truth (the duplicate root middleware.ts was removed).
 * Responsibilities:
 *  1. Legacy /terms/[slug] → /terms/[letter]/[slug] redirect (merged from the old root middleware).
 *  2. Coarse auth gate on protected areas.
 *
 * SECURITY MODEL (P0 remediation): the access token is in memory and not visible to the edge, so
 * this gates on the un-forgeable httpOnly `baalvion_refresh` cookie set by auth-service. Per-role
 * authorization is enforced in the API + client guards.
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';
const PROTECTED_PREFIXES = ['/admin', '/creator/dashboard', '/editor', '/writer', '/premium'];

// The retired per-app /admin panel redirects to the central admin-platform
// console. The console URL is env-driven so production points at the real CMS;
// the hardcoded localhost is a DEV-ONLY fallback (guarded by NODE_ENV). In
// production with no env set we SKIP the redirect rather than bounce users to
// a developer's localhost.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ADMIN_CONSOLE_URL =
  process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ||
  (IS_PRODUCTION ? '' : 'http://localhost:3030/imperialpedia');

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-app admin RETIRED → central admin-platform console (before the auth gate).
  // Only redirect when the console URL is configured; in production with no env
  // set we fall through to the coarse auth gate below rather than send users to
  // localhost.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (ADMIN_CONSOLE_URL) {
      return NextResponse.redirect(new URL(ADMIN_CONSOLE_URL));
    }
  }

  // 1) Legacy terms URL structure redirect
  if (pathname.startsWith('/terms/') && pathname.split('/').length === 3) {
    const slug = pathname.split('/')[2];
    if (slug.length === 1 || slug === 'num') {
      return NextResponse.next();
    }
    const firstChar = slug.charAt(0).toLowerCase();
    const letter = /^[0-9]/.test(firstChar) ? 'num' : firstChar;
    return NextResponse.redirect(new URL(`/terms/${letter}/${slug}`, request.url), 301);
  }

  // 2) Coarse auth gate on protected areas
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
    if (!hasSession) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = '/auth/sign-in';
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/terms/:path*',
    '/admin/:path*',
    '/creator/dashboard/:path*',
    '/editor/:path*',
    '/writer/:path*',
    '/premium/:path*',
  ],
};
