// Public same-origin BFF for the "Contact Investor Relations" form. Forwards an inbound message
// to ir-service (server-side, so IR_SERVICE_URL stays private). No auth — anyone can reach IR.
const IR_SERVICE_URL = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

export const dynamic = 'force-dynamic';

interface ContactPayload {
  name?: string;
  email?: string;
  company?: string;
  inquiryType?: string;
  subject?: string;
  message?: string;
  website?: string; // honeypot
}

export async function POST(req: Request) {
  let body: ContactPayload = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const message = (body.message || '').trim();
  if (name.length < 2 || !email.includes('@') || message.length < 10) {
    return Response.json(
      { success: false, error: 'Please provide your name, a valid email, and a short message.' },
      { status: 400 },
    );
  }

  const payload = {
    name,
    email,
    company: body.company?.trim() || undefined,
    inquiry_type: body.inquiryType || undefined,
    subject: body.subject?.trim() || undefined,
    message,
    website: body.website || undefined, // forwarded so the service can drop bot submissions
  };

  try {
    const res = await fetch(`${IR_SERVICE_URL}/api/v1/contact-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return Response.json(
        { success: false, error: json?.error?.message || 'Could not send your message.' },
        { status: res.status || 502 },
      );
    }
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { success: false, error: 'The contact service is temporarily unavailable. Please email invrel@baalvion.com directly.' },
      { status: 502 },
    );
  }
}
