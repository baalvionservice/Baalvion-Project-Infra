import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware for company-unified-dashboard.
 *
 * SECURITY MODEL (P0 remediation):
 *  - The access token is held in memory by the client and is NOT visible to middleware.
 *  - The only auth cookie is the httpOnly, sameSite=strict `baalvion_refresh` refresh cookie
 *    set by auth-service. The client cannot forge or read it.
 *  - This middleware is a coarse UX gate on the presence of that un-forgeable cookie. REAL
 *    enforcement happens at the API boundary (every data call requires a valid Bearer access
 *    token, obtained only via a successful cookie refresh) and in client route guards.
 *  - We deliberately do NOT trust any client-readable role/session cookie (the old forgeable
 *    `baalvion_dash_token` / `Authorization` cookies are no longer honored).
 */

// Gateway-BFF: the un-forgeable HttpOnly refresh cookie the gateway sets is named `refresh_token`.
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'refresh_token';

const PUBLIC_PREFIXES = [
  '/marketing',
  '/auth',
  '/auth-bff', // same-origin auth proxy (login/refresh/logout) must be reachable unauthenticated
  '/install',
  '/portal',
  '/api', // API routes handle their own auth
  '/_next',
  '/favicon.ico',
  '/public',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Presence of the un-forgeable httpOnly refresh cookie gates entry to protected shells.
  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);

  if (!hasSession) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // `.*\\..*` excludes any path with a file extension (e.g. /icons/crm.png, /og-image.png) so
  // static public/ assets bypass middleware and are served directly instead of hitting route logic.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
