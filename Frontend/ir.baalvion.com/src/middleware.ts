import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRequiredPermissionForRoute } from '@/lib/rbac/routeRegistry';
import {
  INVITE_COOKIE,
  REQUEST_ACCESS_PATH,
  configuredInvites,
  isInviteGated,
  resolveCode,
  resolveInviteId,
} from '@/lib/invite-gate';

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Investor-side invitation gate. See lib/invite-gate.ts for the s.42 constraint behind it.
  if (isInviteGated(pathname)) {
    const invites = configuredInvites(process.env);

    // An invitation link carries the code once; it is exchanged for a cookie and stripped from
    // the URL so the code does not end up in browser history, referrers or shared links. The
    // cookie holds the invitation ID, never the code — a stolen cookie then names a single
    // revocable recipient instead of handing over a working credential.
    const supplied = request.nextUrl.searchParams.get('code');
    const redeemed = supplied ? await resolveCode(supplied, invites) : null;
    if (redeemed) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete('code');
      const response = NextResponse.redirect(clean);
      response.cookies.set(INVITE_COOKIE, redeemed.id, {
        httpOnly: true,
        sameSite: 'lax',
        secure: IS_PRODUCTION,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      // Who was let in, and when. s.42 is about identified persons, so an access record that
      // cannot name the person is not much of a record.
      console.info(`[invite] redeemed id=${redeemed.id} label=${JSON.stringify(redeemed.label)} path=${pathname}`);
      return response;
    }

    const invited = resolveInviteId(request.cookies.get(INVITE_COOKIE)?.value, invites);
    // Development stays open so the funnel is workable locally; production does not.
    if (!invited && IS_PRODUCTION) {
      const url = request.nextUrl.clone();
      url.pathname = REQUEST_ACCESS_PATH;
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

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
    '/invest',
    '/invest/:path*',
    '/onboarding',
    '/onboarding/:path*',
  ],
};
