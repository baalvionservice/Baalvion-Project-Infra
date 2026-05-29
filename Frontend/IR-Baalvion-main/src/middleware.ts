import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRequiredPermissionForRoute } from '@/lib/rbac/routeRegistry';

/**
 * Institutional Edge Gatekeeper
 *
 * SECURITY MODEL (P0 remediation):
 *  - The access token is in memory and is NOT visible to the edge, so per-permission RBAC can no
 *    longer be evaluated here. Middleware is a COARSE gate: any route that requires a permission
 *    requires an authenticated session, proven by the un-forgeable httpOnly `baalvion_refresh`
 *    cookie set by auth-service.
 *  - Per-permission authorization is enforced client-side (lib/rbac/checkPermission) and, decisively,
 *    at the API boundary (every data call needs a valid Bearer access token).
 *  - The old forgeable `baalvion_session_mock` role cookie is NO LONGER read or trusted.
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requiredPermission = getRequiredPermissionForRoute(pathname);
  if (!requiredPermission) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('login', '1');
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/data-room/:path*',
    '/admin/:path*',
    '/phase2/:path*',
    '/phase3/:path*',
    '/performance/:path*',
    '/capital-ops/:path*',
    '/governance/my-voting',
  ],
};
