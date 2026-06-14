import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isSupportedCountry,
  detectCountryFromAcceptLanguage,
} from '@/lib/i18n/countries';

/**
 * Amarisé route protection + multi-market routing (P0).
 *
 *  - Account areas (/[country]/account/*) require the un-forgeable httpOnly
 *    `baalvion_refresh` cookie. Login/register/reset stay public.
 *  - Every public page lives under a `[country]` segment. Requests with a
 *    missing or invalid country are normalized to the visitor's preferred
 *    market (cookie → Accept-Language → default) so no page renders under a
 *    bogus jurisdiction.
 *  - The resolved country is forwarded to Server Components via the
 *    `x-amarise-country` request header (read by the root layout for <html lang/dir>).
 */
const REFRESH_COOKIE = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'baalvion_refresh';
const ACCOUNT_PUBLIC = new Set(['login', 'register', 'reset-password', 'forgot-password']);
const COUNTRY_COOKIE = 'maison_country';

function applyHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  return res;
}

function resolvePreferredCountry(request: NextRequest): string {
  const cookie = request.cookies.get(COUNTRY_COOKIE)?.value;
  if (isSupportedCountry(cookie)) return cookie;
  return detectCountryFromAcceptLanguage(request.headers.get('accept-language'));
}

function passThrough(request: NextRequest, country: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-amarise-country', country);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  // Remember the last valid market for future root redirects.
  res.cookies.set(COUNTRY_COOKIE, country, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return applyHeaders(res);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-app admin RETIRED → bounce /admin straight to the central admin-platform console.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL(process.env.NEXT_PUBLIC_ADMIN_CONSOLE_URL || 'http://localhost:3030/commerce'));
  }

  const preferred = resolvePreferredCountry(request);

  // Root → preferred market hub (was hardcoded to /us).
  if (pathname === '/') {
    return applyHeaders(NextResponse.redirect(new URL(`/${preferred}`, request.url)));
  }

  const seg = pathname.split('/').filter(Boolean);
  const rawFirst = seg[0] ?? '';
  const first = rawFirst.toLowerCase();

  // Asset / metadata paths carry a file extension in their final segment — sitemap.xml & robots.txt
  // at the root, but also nested static files like /placeholder/hermes.jpg. Checking only the first
  // segment missed nested assets, so they were wrongly country-redirected and never served. Detect a
  // dot in the LAST segment so every public/ asset (root or nested) passes straight through.
  const isAsset = (seg[seg.length - 1] ?? '').includes('.');

  // Missing or invalid country segment → normalize to the preferred market.
  if (!isAsset && !isSupportedCountry(first)) {
    // A 2-char first segment is a wrong country code (drop it); anything else is
    // a country-less deep link (prepend the preferred country).
    const rest = rawFirst.length === 2 ? seg.slice(1).join('/') : seg.join('/');
    const url = new URL(`/${preferred}${rest ? `/${rest}` : ''}`, request.url);
    url.search = request.nextUrl.search;
    return applyHeaders(NextResponse.redirect(url));
  }

  if (isAsset) {
    return applyHeaders(NextResponse.next());
  }

  // Canonicalize country casing: /UK/… → /uk/… (one canonical lower-case URL per market).
  if (rawFirst !== first) {
    const rest = seg.slice(1).join('/');
    const url = new URL(`/${first}${rest ? `/${rest}` : ''}`, request.url);
    url.search = request.nextUrl.search;
    return applyHeaders(NextResponse.redirect(url));
  }

  const country = first; // guaranteed supported + lower-case here
  const isAccount = seg[1] === 'account';
  const accountIsPublic = isAccount && ACCOUNT_PUBLIC.has(seg[2] ?? '');
  const needsAuth = isAccount && !accountIsPublic;

  if (needsAuth && !request.cookies.get(REFRESH_COOKIE)?.value) {
    const url = new URL(`/${country}/account/login`, request.url);
    url.searchParams.set('redirect', pathname);
    return applyHeaders(NextResponse.redirect(url));
  }

  return passThrough(request, country);
}

export const config = {
  matcher: [
    '/((?!api|auth-bff|_next/static|_next/image|favicon.ico).*)',
  ],
};
