import { NextResponse } from 'next/server';

// Same-origin BFF: proxy the public events list from ir-service (server-side, reaches
// 127.0.0.1:3008). Falls back to an empty list if the backend is unreachable so the
// events calendar still renders.
export const dynamic = 'force-dynamic';

const IR = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

export async function GET() {
  try {
    const res = await fetch(`${IR}/api/v1/events?limit=100`, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ success: true, data: { items: [] } });
  }
}
