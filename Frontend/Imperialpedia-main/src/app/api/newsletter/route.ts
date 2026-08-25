import { NextResponse } from 'next/server';

/**
 * @fileOverview Newsletter signup endpoint.
 *
 * Proxies server-side to imperialpedia-service's real subscriber list
 * (POST /newsletter/subscribe — see Backend/services/knowledge/imperialpedia-service/
 * controller/newsletterController.js). The address is genuinely stored now; this used
 * to validate the format and return success without persisting anything anywhere.
 */
const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3004/api/v1');

export async function POST(request: Request) {
  let email: string | undefined;
  let source = 'website';
  try {
    const body = await request.json();
    email = typeof body?.email === 'string' ? body.email : undefined;
    if (typeof body?.source === 'string' && body.source.trim()) source = body.source.trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Please provide a valid email address." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`${IMP_API}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      const errJson = await upstream.json().catch(() => null);
      return NextResponse.json(
        { success: false, message: errJson?.error?.message || errJson?.message || 'Please provide a valid email address.' },
        { status: upstream.status === 400 ? 400 : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You're subscribed.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 502 }
    );
  }
}
