import { NextResponse } from 'next/server';
import { REFRESH_COOKIE, isLocalAuthEnabled } from '@/lib/auth/local-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth-local/logout — clear the refresh cookie.
 * Fail-closed: returns 404 unless local auth is explicitly enabled (never in production).
 */
export async function POST() {
  if (!isLocalAuthEnabled()) {
    return NextResponse.json(
      { success: false, error: { message: 'Not found.' } },
      { status: 404 },
    );
  }
  const res = NextResponse.json({ success: true, data: null });
  res.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
