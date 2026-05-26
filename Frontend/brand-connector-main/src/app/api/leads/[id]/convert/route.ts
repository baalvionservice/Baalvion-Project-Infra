import { NextRequest, NextResponse } from 'next/server';

const BRAND_URL = process.env.BRAND_API_URL || 'http://localhost:3006';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = request.headers.get('Authorization');
  const body = await request.json().catch(() => ({}));
  try {
    const res = await fetch(`${BRAND_URL}/api/leads/${id}/convert`, {
      method: 'POST',
      headers: { Authorization: token || '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Brand service unavailable' }, { status: 502 });
  }
}
