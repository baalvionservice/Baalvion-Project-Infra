import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware for company-unified-dashboard.
 *
 * Protected: all routes except /marketing/*, /auth/*, /install, /portal/*
 * Auth check: reads `baalvion_dash_token` cookie (set by the login page after
 * localStorage write + cookie sync) or Authorization cookie.
 */

const PUBLIC_PREFIXES = [
  '/marketing',
  '/auth',
  '/install',
  '/portal',
  '/api',           // API routes handle their own auth
  '/_next',
  '/favicon.ico',
  '/public',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through immediately
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const token =
    request.cookies.get('baalvion_dash_token')?.value ||
    request.cookies.get('Authorization')?.value;

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    // Preserve the original destination so the login page can redirect back
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token present — allow the request through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and Next.js internals.
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
