import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/mfa', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Static files / API routes / same-origin auth proxy pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth-bff') || // login/refresh/logout proxy must be reachable unauthenticated
    pathname.includes('.') // static assets
  ) {
    return NextResponse.next();
  }

  // The client-side AuthProvider does the real session bootstrap (silent cookie refresh).
  // Middleware is a coarse gate on the un-forgeable httpOnly refresh cookie set by auth-service.
  const hasCookie = request.cookies.has(process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh');

  if (!hasCookie && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasCookie && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
