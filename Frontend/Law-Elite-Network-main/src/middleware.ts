import { NextRequest, NextResponse } from 'next/server';

// The retired per-app /admin panel redirects to the central admin-platform
// console. The console URL is env-driven so production points at the real CMS;
// the hardcoded localhost is a DEV-ONLY fallback (guarded by NODE_ENV). In
// production with no env set we SKIP the redirect rather than bounce users to
// a developer's localhost.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ADMIN_CONSOLE_URL =
  process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL ||
  (IS_PRODUCTION ? '' : 'http://localhost:3030/law');

/**
 * Law-Elite edge middleware.
 *
 * SECURITY MODEL (P0 remediation): the access token is held in memory and law-service (an HS256
 * island) does not issue an httpOnly session cookie, so the edge has NO server-visible, un-forgeable
 * session to gate on. The previous gate trusted a base64 `law_elite_session` role cookie that any
 * client could forge (privilege escalation) — it has been REMOVED and is no longer read.
 *
 * Route protection is therefore enforced:
 *   1. CLIENT-SIDE — components/auth/ProtectedRoute + components/auth/RoleGuard, and
 *   2. at the API boundary — every authenticated call requires a valid Bearer access token.
 *
 * Phase 1b: once law-service issues an httpOnly refresh cookie (bundled with the elite-circle
 * island backend work), an edge presence-gate on that cookie can be reinstated here.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Per-app admin RETIRED → central admin-platform console. Only redirect when
  // the console URL is configured; in production with no env set we fall through
  // rather than send users to localhost.
  const { pathname } = request.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (ADMIN_CONSOLE_URL) {
      return NextResponse.redirect(new URL(ADMIN_CONSOLE_URL));
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
