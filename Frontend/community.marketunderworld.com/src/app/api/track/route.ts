import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_SERVICE = process.env.ADMIN_SERVICE_URL || 'http://localhost:9002';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Server-to-server — bypasses browser CORS
    const response = await fetch(`${ADMIN_SERVICE}/v1/track/visitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[/api/track] Admin service error:', text);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[/api/track] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// Admin — proxy GET visitors list
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const { searchParams } = new URL(req.url);

    const upstream = await fetch(
      `${ADMIN_SERVICE}/v1/track/visitors?${searchParams.toString()}`,
      {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      }
    );

    const data = await upstream.text();
    return new NextResponse(data, {
      status: upstream.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('[/api/track GET] Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
