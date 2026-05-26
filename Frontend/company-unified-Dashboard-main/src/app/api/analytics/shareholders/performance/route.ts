import { NextRequest, NextResponse } from 'next/server';

const DASHBOARD_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3009';

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization');
  try {
    const res = await fetch(`${DASHBOARD_URL}/api/v1/analytics/shareholders/performance`, {
      headers: { Authorization: token || '' },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Dashboard service unavailable' }, { status: 502 });
  }
}
