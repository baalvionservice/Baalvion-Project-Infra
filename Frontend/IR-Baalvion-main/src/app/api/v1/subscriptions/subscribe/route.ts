import { NextResponse } from 'next/server';

// Same-origin BFF: forward a public email-alerts signup to ir-service (server-side).
export const dynamic = 'force-dynamic';

const IR = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${IR}/api/v1/subscriptions/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({ success: false }));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Subscription service unavailable' } }, { status: 502 });
  }
}
