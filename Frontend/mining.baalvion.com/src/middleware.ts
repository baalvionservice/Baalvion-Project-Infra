import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Mining route protection (P0).
 *
 * Gates the authenticated areas (/admin, /dashboard) on the un-forgeable httpOnly `baalvion_refresh`
 * cookie set by auth-service. This replaces the deleted client-side `/admin-demo-access` page and its
 * `localStorage.adminRole` elevation. Per-role admin authorization is enforced in the admin layout
 * (real `authApi.me()` check) + at the API.
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!request.cookies.get(REFRESH_COOKIE)?.value) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
