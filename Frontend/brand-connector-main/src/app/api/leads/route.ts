import { NextRequest, NextResponse } from 'next/server';

const BRAND_URL = process.env.BRAND_API_URL || 'http://localhost:3006';

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization');
  try {
    const res = await fetch(`${BRAND_URL}/api/leads${request.nextUrl.search}`, {
      headers: { Authorization: token || '' },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Brand service unavailable' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization');
  const body = await request.json().catch(() => ({}));
  try {
    const res = await fetch(`${BRAND_URL}/api/leads`, {
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
