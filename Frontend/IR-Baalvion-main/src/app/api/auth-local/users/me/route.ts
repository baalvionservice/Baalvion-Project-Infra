import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { REFRESH_COOKIE, publicUser, userFromRefresh } from '@/lib/auth/local-auth';

export const dynamic = 'force-dynamic';

/** GET /api/auth-local/users/me — resolve the current user from the refresh cookie. */
export async function GET() {
  const store = await cookies();
  const user = userFromRefresh(store.get(REFRESH_COOKIE)?.value);

  if (!user) {
    return NextResponse.json(
      { success: false, error: { message: 'No active session.' } },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true, data: publicUser(user) });
}
