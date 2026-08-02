import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { sendLead } from '@/lib/leadNotify';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Valid email required'),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
});

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Accepts contact form submissions and relays them to notification-service's public
 * lead-capture endpoint, which sends the actual team notification email.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`contact:${ip}`, { limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS });
    if (!limit.success) {
      return NextResponse.json(
        { success: false, message: 'Too many requests, please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

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

    await sendLead('imperialpedia-contact', [
      { k: 'Name', v: name },
      { k: 'Email', v: email },
      { k: 'Subject', v: subject },
    ], message);

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
