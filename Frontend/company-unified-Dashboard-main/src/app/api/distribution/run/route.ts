import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3009';

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization');
  const body = await request.json().catch(() => ({}));
  try {
    const res = await fetch(`${DASHBOARD_URL}/api/v1/distribution/run`, {
      method: 'POST',
      headers: { Authorization: token || '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Dashboard service unavailable' }, { status: 502 });
  }
}
