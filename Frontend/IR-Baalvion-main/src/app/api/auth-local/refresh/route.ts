import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  REFRESH_COOKIE,
  mintAccessToken,
  publicUser,
  userFromRefresh,
} from '@/lib/auth/local-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth-local/refresh — re-mint an access token from the httpOnly refresh cookie.
 * Lets the in-memory access token survive full-page navigations (the cookie is the source of truth).
 */
export async function POST() {
  const store = await cookies();
  const user = userFromRefresh(store.get(REFRESH_COOKIE)?.value);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'No active session.' } },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { accessToken: mintAccessToken(user), user: publicUser(user) },
  });
}
