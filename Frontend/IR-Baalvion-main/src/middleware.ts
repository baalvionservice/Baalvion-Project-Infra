import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth/session';
import { getRequiredPermissionForRoute } from '@/lib/rbac/routeRegistry';
import { checkPermission } from '@/lib/rbac/checkPermission';

/**
 * Institutional Edge Gatekeeper
 * Enforces RBAC policy before the request reaches any application logic.
 *
 * Cookie resolution priority:
 *  1. `ir_baalvion_access_token` — real JWT set by auth-client.ts after login
 *  2. `baalvion_session_mock` — legacy role cookie (kept for transition period)
 *
 * Both cookies are passed through getSessionFromCookie() which handles JWT
 * decoding as well as the legacy plain-role and JSON formats.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Resolve Required Permission for current route
  const requiredPermission = getRequiredPermissionForRoute(pathname);

  // If route is public, proceed without auth check
  if (!requiredPermission) {
    return NextResponse.next();
  }

  // 2. Resolve session — prefer real JWT, fall back to legacy mock cookie
  const jwtCookie = request.cookies.get('ir_baalvion_access_token')?.value;
  const mockCookie = request.cookies.get('baalvion_session_mock')?.value;
  const sessionSource = jwtCookie || mockCookie;
  const session = getSessionFromCookie(sessionSource);

  // 3. Evaluate RBAC Policy
  const isAuthorized = checkPermission(session.role, requiredPermission);

  if (!isAuthorized) {
    console.warn(
      `[RBAC] Access Denied: ${pathname} requires ${requiredPermission}. Current role: ${session.role}`
    );
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Matcher configuration for institutional routes
 */
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
