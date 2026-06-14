import { NextResponse } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/auth/local-auth';

export const dynamic = 'force-dynamic';

/** POST /api/auth-local/logout — clear the refresh cookie. */
export async function POST() {
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
