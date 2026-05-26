import { NextRequest, NextResponse } from 'next/server';

/**
 * Route protection rules:
 * - /dashboard, /lawyer/*, /lawyer (lawyer-only) — redirect to /login if no session cookie
 * - /admin/* — redirect to /login if no session cookie
 * - /cases/*, /chat/*, /appointments, /vault, /transactions, /billing, /profile, /notifications,
 *   /my-counsel, /referral, /onboarding — redirect to /login if no session cookie
 * - /login, /register, /access-denied — public
 * - All other routes — public (knowledge hub, lawyer search, articles, etc.)
 */

const AUTH_COOKIE = 'law_elite_session';

/** Routes that require any authenticated user */
const AUTH_REQUIRED_PREFIXES = [
  '/dashboard',
  '/cases',
  '/chat',
  '/appointments',
  '/vault',
  '/transactions',
  '/billing',
  '/profile',
  '/notifications',
  '/my-counsel',
  '/referral',
  '/onboarding',
  '/checkout',
  '/booking-details',
];

/** Routes restricted to admin role */
const ADMIN_PREFIXES = ['/admin'];

/** Routes restricted to lawyers */
const LAWYER_PREFIXES = ['/lawyer/dashboard', '/lawyer/earnings', '/lawyer/requests', '/lawyer/availability', '/lawyer/profile'];

/** Public pages — never redirect */
const PUBLIC_EXACT = new Set(['/login', '/register', '/access-denied', '/', '/about-us', '/contact-us', '/careers', '/privacy-policy', '/terms-of-service', '/editorial-process', '/advertise', '/plans', '/search']);

function needsAuth(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));
}

function needsAdmin(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
}

function needsLawyer(pathname: string): boolean {
  return LAWYER_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Static assets, API routes, Next.js internals — always pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|woff|woff2|ttf|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = Boolean(sessionCookie);

  // Decode role from session cookie (simple base64 JSON — Firebase token is handled client-side)
  let role: string | null = null;
  if (sessionCookie) {
    try {
      const decoded = JSON.parse(atob(sessionCookie));
      role = decoded?.role ?? null;
    } catch {
      // Cookie is not our format — could be Firebase token, treat as authenticated
      role = 'client';
    }
  }

  // Admin routes — require admin role
  if (needsAdmin(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Lawyer-specific routes — require lawyer role
  if (needsLawyer(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    if (role !== 'lawyer' && role !== 'admin') {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // General auth-required routes
  if (needsAuth(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Redirect already-authenticated users away from login/register
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirect') ?? '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
