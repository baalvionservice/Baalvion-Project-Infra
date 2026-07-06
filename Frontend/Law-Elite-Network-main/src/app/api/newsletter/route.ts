import { NextResponse } from 'next/server';

/**
 * Placeholder newsletter-subscription endpoint (mirrors Imperialpedia's
 * /api/newsletter pattern). In production this would connect to an email
 * service provider or CRM.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Please provide a valid email address.' }, { status: 400 });
    }

    // TODO: Connect to email service provider.

    return NextResponse.json({ success: true, message: "You're subscribed. Check your inbox for confirmation." });
  } catch {
    return NextResponse.json({ success: false, message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
