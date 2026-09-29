// Same-origin BFF for investor-access applications. Forwards the onboarding submission
// to ir-service (server-side, so IR_SERVICE_URL stays private) and returns the created
// application's reference. Public — a prospect is not yet authenticated.
const IR_SERVICE_URL = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

export const dynamic = 'force-dynamic';

interface OnboardingPayload {
  fullName?: string;
  email?: string;
  investorType?: string;
  institutionName?: string;
  accredited?: boolean;
  commitment?: number;
  message?: string;
}

export async function POST(req: Request) {
  let body: OnboardingPayload = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.fullName || !body.email) {
    return Response.json({ success: false, error: 'Name and email are required.' }, { status: 400 });
  }

  const payload = {
    full_name: body.fullName,
    email: body.email,
    investor_type: body.investorType,
    entity: body.institutionName || undefined,
    accredited: !!body.accredited,
    commitment: typeof body.commitment === 'number' ? body.commitment : undefined,
    message: body.message || undefined,
  };

  try {
    const res = await fetch(`${IR_SERVICE_URL}/api/v1/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return Response.json(
        { success: false, error: json?.message || 'Could not submit your application.' },
        { status: res.status || 502 },
      );
    }
    return Response.json({ success: true, reference: json.data?.reference, status: json.data?.status });
  } catch {
    return Response.json(
      { success: false, error: 'The application service is temporarily unavailable. Please try again.' },
      { status: 502 },
    );
  }
}
