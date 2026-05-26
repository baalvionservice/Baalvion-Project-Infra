import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'bos_admin';
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

function bufToBase64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlToUint8(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function verifySession(cookie: string, secret: string): Promise<boolean> {
  try {
    const dotIndex = cookie.indexOf('.');
    if (dotIndex === -1) return false;

    const tsStr = atob(cookie.slice(0, dotIndex));
    const ts = parseInt(tsStr, 10);
    if (isNaN(ts) || Date.now() - ts > MAX_AGE_MS) return false;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const sig = base64urlToUint8(cookie.slice(dotIndex + 1));
    const data = new TextEncoder().encode(String(ts));
    return await crypto.subtle.verify('HMAC', key, sig, data);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    console.error('[BOS] ADMIN_SECRET_KEY not configured');
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!sessionCookie || !(await verifySession(sessionCookie, secret))) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};

export { bufToBase64url };
