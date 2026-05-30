import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// About Baalvion content is now managed centrally in the Baalvion CMS
// (admin-platform console). The site's former local /admin panel is retired:
// every /admin request is redirected to the central console for this website.
const CENTRAL_CONSOLE_URL =
  process.env.NEXT_PUBLIC_CMS_CONSOLE_URL ||
  'http://localhost:3030/cms/websites/cf2d3583-7247-48a6-9fd2-0959043c7a8b';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.redirect(CENTRAL_CONSOLE_URL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
