import { resolveIdentity } from '@/lib/auth/identity';
import { REFRESH_COOKIE, userFromRefresh, isLocalAuthEnabled } from '@/lib/auth/local-auth';
import { devOrgForUser } from '@/lib/marketplace-auth';
import { cookies } from 'next/headers';

// The caller's own identity, so a shared surface (the deal room) can tell which side of the table
// the viewer is on. Returns the org only — never a token, and never anyone else's identity.
export const dynamic = 'force-dynamic';

export async function GET() {
  const identity = await resolveIdentity();
  if (identity) {
    return Response.json({ success: true, data: { userId: identity.userId, orgId: identity.orgId } });
  }
  if (isLocalAuthEnabled()) {
    const user = userFromRefresh((await cookies()).get(REFRESH_COOKIE)?.value);
    if (user) return Response.json({ success: true, data: { userId: user.id, orgId: devOrgForUser(String(user.id)) } });
  }
  return Response.json({ success: false, error: { code: 'UNAUTHENTICATED' } }, { status: 401 });
}
