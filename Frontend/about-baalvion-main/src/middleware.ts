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

const ADMIN_COOKIE = 'bos_admin';
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // matches the cookie's maxAge in login/actions.ts

function b64urlToBytes(value: string): ArrayBuffer {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
  const bin = atob(padded);
  // Allocate a plain ArrayBuffer: Uint8Array.from() is typed ArrayBufferLike, which does not
  // satisfy crypto.subtle's BufferSource under strict TS.
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i += 1) view[i] = bin.charCodeAt(i);
  return buf;
}

/**
 * Verify the HMAC session cookie minted by /admin/login/actions.ts.
 *
 * That action signed a session and set the cookie — but NOTHING ever read it back, so the
 * local admin panel was protected only by the middleware redirect below. When the central
 * console is unconfigured that redirect does not fire, which left all 13 admin pages open to
 * anyone who navigated to /admin. This closes it: no valid signature, no admin.
 */
async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) return false; // fail closed — an unset secret must never mean "allow"

  const raw = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!raw) return false;

  const [tsB64, sigB64url] = raw.split('.');
  if (!tsB64 || !sigB64url) return false;

  try {
    const ts = Number(atob(tsB64));
    if (!Number.isFinite(ts)) return false;
    // Reject an expired session even if the cookie itself outlives its maxAge.
    if (Date.now() - ts > SESSION_MAX_AGE_MS) return false;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    // crypto.subtle.verify is constant-time, so no manual string comparison.
    return await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(sigB64url),
      new TextEncoder().encode(String(ts)),
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Only redirect when the central console is configured. In production with
    // no CMS env set we fall through to the app rather than redirect to localhost.
    if (CENTRAL_CONSOLE_URL) {
      return NextResponse.redirect(CENTRAL_CONSOLE_URL);
    }

    // Falling through to the local panel — it must now prove a session. The login page and
    // its POST have to stay reachable, or there would be no way to obtain one.
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
      return NextResponse.next();
    }
    if (!(await hasValidAdminSession(request))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
