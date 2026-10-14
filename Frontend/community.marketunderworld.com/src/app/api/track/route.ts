import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

const ADMIN_SERVICE = process.env.ADMIN_SERVICE_URL || 'http://localhost:9002';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // This call comes from our own server, so the admin service would otherwise log the edge's address,
    // not the visitor's. Cloudflare already knows who the visitor is: pass their real IP and location on.
    let cf: Record<string, unknown> = {};
    try { cf = (getCloudflareContext().cf as Record<string, unknown> | undefined) ?? {}; } catch { /* not on Workers */ }
    const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
    const visitorIp = req.headers.get('cf-connecting-ip') ?? undefined;

    // Server-to-server — bypasses browser CORS
    const response = await fetch(`${ADMIN_SERVICE}/v1/track/visitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(visitorIp ? { 'x-forwarded-for': visitorIp } : {}) },
      body: JSON.stringify({
        ...body,
        ip: visitorIp ?? body.ip,
        geo: {
          country: str(cf.country),
          region: str(cf.region),
          city: str(cf.city),
          isp: str(cf.asOrganization),
          timezone: str(cf.timezone),
          latitude: str(cf.latitude),
          longitude: str(cf.longitude),
        },
      }),
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
