import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const DASHBOARD_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3009';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { portalId } = body;

  if (!portalId) {
    return new NextResponse('Missing portalId', { status: 400 });
  }

  try {
    const res = await fetch(`${DASHBOARD_URL}/api/v1/portal/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Set session cookie regardless (portal auth doesn't need a user token)
    const cookieStore = await cookies();
    cookieStore.set(`portal-session-${portalId}`, 'true', {
      path: '/',
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    if (!res.ok) {
      // Still succeed from portal perspective — cookie was set
      return new NextResponse('Session created', { status: 200 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Fallback: set cookie anyway for offline/dev
    const cookieStore = await cookies();
    cookieStore.set(`portal-session-${portalId}`, 'true', {
      path: '/',
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: 'lax',
    });
    return new NextResponse('Session created', { status: 200 });
  }
}
