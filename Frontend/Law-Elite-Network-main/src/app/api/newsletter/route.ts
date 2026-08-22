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

    // TODO: Connect to email service provider. Until that's wired up, don't
    // promise a confirmation email that will never arrive.

    return NextResponse.json({ success: true, message: "Thanks -- we've got your email." });
  } catch {
    return NextResponse.json({ success: false, message: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
