import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { sendLead } from '@/lib/leadNotify';

// Was a hardcoded literal ("secure-admin-key") checked into source — anyone with repo read
// access had full delete/update rights over every inquiry, and GET returned every inquiry's
// name/email/message with NO auth at all. Now checked against ADMIN_SECRET_KEY (the same
// server secret lib/env.ts validates and requires at runtime boot in production — not a new
// var to configure), fails CLOSED when unset. Read directly via process.env rather than
// importing lib/env's `env` object: that module's validateEnv() throws on import whenever
// ADMIN_SECRET_KEY is absent from the CURRENT process (including Next's build-time page-data
// collection step, which may run in an environment without production secrets) — importing
// it here made `next build` hard-fail in CI even though this route only needs the value at
// request time, when Vercel's runtime env is what's actually in scope.
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;

function isAuthorized(req: Request): boolean {
  if (!ADMIN_KEY) return false;
  const key = req.headers.get('x-admin-key') ?? '';
  const a = Buffer.from(key);
  const b = Buffer.from(ADMIN_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

const inquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  message: z.string().min(1).max(5000),
  // Honeypot — real users never populate this (hidden via CSS in the form).
  company_website: z.string().max(200).optional(),
});

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  return NextResponse.json(db.inquiries.getAll());
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = rateLimit(`inquiry:${ip}`, { limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS });
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please correct the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const data = parsed.data;

  // Honeypot tripped — pretend success, do nothing (no bot signal, no send, no storage).
  if (data.company_website) {
    return NextResponse.json({ id: 'ok', name: data.name, email: data.email, message: data.message, status: 'New' });
  }

  const newInquiry = db.inquiries.add({ name: data.name, email: data.email, message: data.message });

  // Storage failure must not block notifying the team — sent regardless of db result.
  await sendLead('about-inquiry', [
    { k: 'Name', v: data.name },
    { k: 'Email', v: data.email },
  ], data.message);

  return NextResponse.json(newInquiry);
}

export async function PATCH(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const data = await req.json();
  db.inquiries.updateStatus(data.id, data.status);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) db.inquiries.delete(id);
  return NextResponse.json({ success: true });
}
