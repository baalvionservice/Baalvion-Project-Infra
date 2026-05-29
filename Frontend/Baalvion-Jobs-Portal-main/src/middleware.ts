import { type NextRequest, NextResponse } from 'next/server';

/**
 * Jobs Portal edge middleware.
 *
 * NOTE: the previous `src/proxy.ts` (function `proxy`) was NEVER executed by Next.js — middleware
 * MUST be `middleware.ts` exporting `middleware`. This file replaces it so the edge gate actually runs.
 *
 * SECURITY MODEL (P0): the access token is in memory; the edge gates on the un-forgeable httpOnly
 * `baalvion_refresh` cookie set by auth-service. Jobs is a hybrid public-board / private-portal app,
 * so per-route + per-role enforcement is done by the client guards (ProtectedRoute / RoleGuard driven
 * by the AuthProvider silent-refresh bootstrap) and decisively at the API. Middleware here is a
 * defense-in-depth presence gate on the unambiguous authenticated area (/dashboard).
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';
const PROTECTED_PREFIXES = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isProtected && !request.cookies.get(REFRESH_COOKIE)?.value) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: [
    '/((?!api|auth-bff|_next/static|_next/image|favicon.ico).*)',
  ],
};
