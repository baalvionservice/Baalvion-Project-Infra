import { cookies } from 'next/headers';
import { REFRESH_COOKIE, userFromRefresh } from '@/lib/auth/local-auth';

// Same-origin BFF: reports the signed-in investor's deal-room eligibility. The email is derived
// from the session (never client-supplied), so a caller can only ever query their own status.
// Eligibility = an APPROVED application + a corporate email + the post-approval cool-down elapsed.
export const dynamic = 'force-dynamic';

const IR_SERVICE_URL = process.env.IR_SERVICE_URL || 'http://127.0.0.1:3008';

export async function GET() {
  const user = userFromRefresh((await cookies()).get(REFRESH_COOKIE)?.value);
  if (!user?.email) {
    return Response.json({ success: true, data: { signedIn: false, eligible: false, reason: 'NOT_SIGNED_IN' } });
  }

  try {
    const url = `${IR_SERVICE_URL}/api/v1/applications/eligibility?email=${encodeURIComponent(user.email)}`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      return Response.json({ success: true, data: { signedIn: true, eligible: false, reason: 'SERVICE_UNAVAILABLE' } });
    }
    return Response.json({ success: true, data: { signedIn: true, ...json.data } });
  } catch {
    return Response.json({ success: true, data: { signedIn: true, eligible: false, reason: 'SERVICE_UNAVAILABLE' } });
  }
}
