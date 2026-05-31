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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-app admin RETIRED → central admin-platform console (before the auth gate).
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || 'http://localhost:3030/imperialpedia'));
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
