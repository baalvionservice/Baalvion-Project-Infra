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

// IR editorial content is now managed centrally in the Baalvion CMS
// (admin-platform console). The site's former local /admin panel is retired:
// every /admin request is redirected to the central console for this website.
//
// The console URL is env-driven so production points at the real CMS instead of
// a developer's localhost. The hardcoded values below are a DEV-ONLY fallback
// (guarded by NODE_ENV) — in production a missing env var means we skip the
// redirect rather than send users to localhost.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const CMS_URL =
  process.env.NEXT_PUBLIC_CMS_URL ??
  (IS_PRODUCTION ? '' : 'http://localhost:3030/cms');

const CMS_WEBSITE_ID =
  process.env.NEXT_PUBLIC_CMS_WEBSITE_ID ??
  (IS_PRODUCTION ? '' : '7bced69e-a861-4530-9660-e0ddb955d72b');

// Full override still honored for backward compatibility; otherwise compose
// the console URL from the base + website id. Empty if neither is configured.
const CENTRAL_CONSOLE_URL =
  process.env.NEXT_PUBLIC_CMS_CONSOLE_URL ||
  (CMS_URL && CMS_WEBSITE_ID
    ? `${CMS_URL.replace(/\/$/, '')}/websites/${CMS_WEBSITE_ID}`
    : '');

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Only redirect when the central console is configured. In production with
    // no CMS env set we fall through rather than redirect to localhost.
    if (CENTRAL_CONSOLE_URL) {
      return NextResponse.redirect(CENTRAL_CONSOLE_URL);
    }
  }

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
