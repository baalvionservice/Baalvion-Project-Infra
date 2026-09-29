import { NextRequest, NextResponse } from 'next/server';

const BRAND_URL = process.env.BRAND_API_URL || 'http://localhost:3006';

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization');
  try {
    const res = await fetch(`${BRAND_URL}/api/scoring/top-leads${request.nextUrl.search}`, {
      headers: { Authorization: token || '' },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Brand service unavailable' }, { status: 502 });
  }
}
