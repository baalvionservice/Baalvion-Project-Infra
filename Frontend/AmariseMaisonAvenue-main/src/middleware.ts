import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Amarisé route protection (P0).
 * Account areas (/[country]/account/*) and admin (/admin/*) require an authenticated session,
 * proven by the un-forgeable httpOnly `baalvion_refresh` cookie set by auth-service. The login,
 * register and password-reset pages stay public. No client-side role trust.
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';
const ACCOUNT_PUBLIC = new Set(['login', 'register', 'reset-password', 'forgot-password']);

function applyHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  return res;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root redirect to default market hub
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/us', request.url));
  }

  const seg = pathname.split('/').filter(Boolean);
  const isAdmin = seg[0] === 'admin';
  const isAccount = seg[1] === 'account';
  const accountIsPublic = isAccount && ACCOUNT_PUBLIC.has(seg[2] ?? '');
  const needsAuth = isAdmin || (isAccount && !accountIsPublic);

  if (needsAuth && !request.cookies.get(REFRESH_COOKIE)?.value) {
    const country = !isAdmin && seg[0] ? seg[0] : 'us';
    const url = new URL(`/${country}/account/login`, request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!api|auth-bff|_next/static|_next/image|favicon.ico).*)',
  ],
};
