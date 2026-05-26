import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Imperialpedia Route Gatekeeper
 * Checks for a valid access token before allowing access to protected routes.
 * Token validation is lightweight (presence + non-expiry via exp claim).
 * Full signature verification happens server-side in API routes.
 */

const PROTECTED_PREFIXES = [
  '/admin',
  '/creator/dashboard',
  '/editor',
  '/writer',
  '/premium',
];

const PUBLIC_PREFIXES = [
  '/auth',
  '/articles',
  '/news',
  '/search',
  '/about',
  '/_next',
  '/favicon',
  '/api',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isTokenExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths never need a token
  if (isPublicPath(pathname)) return NextResponse.next();

  // Only enforce auth on explicitly protected paths
  if (!isProtectedPath(pathname)) return NextResponse.next();

  // Check for token in cookie (preferred for SSR) or Authorization header
  const cookieToken = request.cookies.get('imperialpedia_access_token')?.value;
  const headerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookieToken || headerToken;

  const isAuthenticated = token && !isTokenExpired(token);

  if (!isAuthenticated) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = '/auth/sign-in';
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/creator/dashboard/:path*',
    '/editor/:path*',
    '/writer/:path*',
    '/premium/:path*',
  ],
};
