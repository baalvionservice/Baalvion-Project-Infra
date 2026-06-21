import { NextRequest, NextResponse } from 'next/server';

/**
 * Registration BFF proxy. The sign-up form POSTs { name, email, password } here; this forwards
 * to the auth-service register endpoint server-side (so the browser stays same-origin and any
 * session cookies set by auth-service flow back). No mock — real registration.
 */
// AUTH_PROXY_TARGET must be supplied in production; localhost is dev-only. An unset
// var in prod collapses to '' so registration fails loudly rather than silently
// proxying to a developer's machine.
const AUTH_TARGET =
  process.env.AUTH_PROXY_TARGET ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001/v1/auth');

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${AUTH_TARGET}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    const res = new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
    // Relay session cookies (auto-login after register) if the auth-service issues them.
    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) res.headers.set('set-cookie', setCookie);
    return res;
  } catch {
    return NextResponse.json(
      { message: 'Authentication service is unreachable. Please try again shortly.' },
      { status: 502 },
    );
  }
}
