import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// About Baalvion content is now managed centrally in the Baalvion CMS
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
  (IS_PRODUCTION ? '' : 'cf2d3583-7247-48a6-9fd2-0959043c7a8b');

// Full override still honored for backward compatibility; otherwise compose
// the console URL from the base + website id. Empty if neither is configured.
const CENTRAL_CONSOLE_URL =
  process.env.NEXT_PUBLIC_CMS_CONSOLE_URL ||
  (CMS_URL && CMS_WEBSITE_ID
    ? `${CMS_URL.replace(/\/$/, '')}/websites/${CMS_WEBSITE_ID}`
    : '');

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Only redirect when the central console is configured. In production with
    // no CMS env set we fall through to the app rather than redirect to localhost.
    if (CENTRAL_CONSOLE_URL) {
      return NextResponse.redirect(CENTRAL_CONSOLE_URL);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
