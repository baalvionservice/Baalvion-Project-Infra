/**
 * @file app/api/public/platform-pulse/route.ts
 * @description Public, unauthenticated platform-wide pulse (DB health, ledger
 * integrity, escrow/trade counts). Deliberately does NOT call verifyIdentity —
 * same pattern as /api/health — because getPlatformPulse() only ever returns
 * aggregate booleans/counts across all tenants, never per-tenant data.
 */
import { getPlatformPulse } from '@/server/public/platform-pulse';
import { ok, fail } from '@/server/http/api';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const pulse = await getPlatformPulse();
    return ok(pulse);
  } catch (err) {
    return fail(503, err instanceof Error ? err.message : 'platform pulse unavailable');
  }
}
