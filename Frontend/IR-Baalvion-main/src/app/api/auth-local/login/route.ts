import { NextResponse } from 'next/server';
import {
  REFRESH_COOKIE,
  encodeRefresh,
  findUser,
  mintAccessToken,
  publicUser,
} from '@/lib/auth/local-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth-local/login — local (dev/standalone) credential exchange.
 * Sets the httpOnly `baalvion_refresh` cookie the middleware gates on and returns an
 * access token + user, matching the shape lib/auth-client.ts expects.
 */
export async function POST(req: Request) {
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body → invalid credentials below */
  }

  const user = findUser(body.email ?? '', body.password ?? '');
  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid email or password.' } },
      { status: 401 },
    );
  }

  const accessToken = mintAccessToken(user);
  const res = NextResponse.json({
    success: true,
    data: { accessToken, user: publicUser(user) },
  });

  res.cookies.set(REFRESH_COOKIE, encodeRefresh(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  });

  return res;
}
