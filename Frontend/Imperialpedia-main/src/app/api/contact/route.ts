import { NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Valid email required'),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
});

/**
 * Accepts contact form submissions. Logs server-side for operational follow-up.
 * Wire to email (e.g. Resend) or a ticketing system when ready.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const honeypot =
      typeof body?.website === 'string' ? body.website.trim() : '';
    if (honeypot.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Thanks — your message was received.',
      });
    }

    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg =
        Object.values(first).flat()[0] || 'Please check your input and try again.';
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }

    const { name, email, subject, message } = parsed.data;

    console.log(
      `[CONTACT] ${subject} | ${name} <${email}>\n${message.slice(0, 500)}${message.length > 500 ? '…' : ''}`
    );

    return NextResponse.json({
      success: true,
      message: 'Thanks — your message was received. We typically reply within one business day.',
    });
  } catch (e) {
    console.error('[API] Contact error:', e);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again or email us directly.' },
      { status: 500 }
    );
  }
}
