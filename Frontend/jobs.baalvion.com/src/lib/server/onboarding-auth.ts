import { NextRequest } from 'next/server';
import { isAdminRole } from '@/lib/access/roles';

/**
 * Server-side authorization for admin-only onboarding endpoints (list + status
 * update).
 *
 * The portal keeps the access token in memory (never in a cookie), so the client
 * sends it as a Bearer token on admin calls. We validate that token against the
 * jobs-service `/me/profile` endpoint — the canonical role resolver — and require
 * the resolved role to be an admin role. This is real authorization: a forged or
 * candidate-level token is rejected, and applicant PII is never exposed to
 * non-admins.
 *
 * `ONBOARDING_ADMIN_TOKEN` (matched via the `x-admin-token` header) provides a
 * server-to-server / scripted bypass for internal automation.
 */
const JOBS_BASE =
  process.env.NEXT_PUBLIC_JOBS_SERVICE_URL ||
  'https://api.baalvion.com/api/v1/ecosystem/jobs/api/v1';

export type AdminAuthResult =
  | { ok: true; role: string }
  | { ok: false; status: number; error: string };

function extractBearer(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token.trim() : null;
}

export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  // Internal/scripted bypass for server-to-server automation.
  const adminToken = process.env.ONBOARDING_ADMIN_TOKEN;
  if (adminToken && request.headers.get('x-admin-token') === adminToken) {
    return { ok: true, role: 'SYSTEM' };
  }

  const token = extractBearer(request);
  if (!token) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  let rawRole: string;
  try {
    // Forward cookies too so the identity service can fall back to the session
    // if it prefers, but the Bearer token is the primary credential.
    const cookie = request.headers.get('cookie') ?? '';
    const res = await fetch(`${JOBS_BASE}/me/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(cookie ? { cookie } : {}),
      },
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: 401, error: 'Invalid or expired session.' };
    }
    if (!res.ok) {
      return { ok: false, status: 502, error: 'Could not verify session.' };
    }

    const json = await res.json().catch(() => null);
    const profile = (json && (json.data ?? json)) as { role?: string } | null;
    rawRole = String(profile?.role ?? '');
  } catch {
    return { ok: false, status: 502, error: 'Could not reach the identity service.' };
  }

  if (!isAdminRole(rawRole)) {
    return { ok: false, status: 403, error: 'Administrator access required.' };
  }
  return { ok: true, role: rawRole };
}
