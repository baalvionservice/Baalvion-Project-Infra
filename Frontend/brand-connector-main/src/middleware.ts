import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Baalvion Connect route protection.
 *
 * SECURITY (P0): re-enabled (was a no-op that allowed instant access to ALL routes). Protected
 * areas require an authenticated session, proven by the un-forgeable httpOnly `baalvion_refresh`
 * cookie set by auth-service. The access token is in memory and not visible to the edge, so
 * per-role authorization is enforced at the API + client guards.
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';
const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/campaigns', '/onboarding', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
  if (!hasSession) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public|logo.png).*)",
  ],
};
