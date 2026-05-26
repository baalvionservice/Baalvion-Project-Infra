import { NextRequest, NextResponse } from 'next/server';

const BRAND_URL = process.env.BRAND_API_URL || 'http://localhost:3006';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = request.headers.get('Authorization');
  try {
    const res = await fetch(`${BRAND_URL}/api/analytics/campaign/${id}`, {
      headers: { Authorization: token || '' },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Brand service unavailable' }, { status: 502 });
  }
}
