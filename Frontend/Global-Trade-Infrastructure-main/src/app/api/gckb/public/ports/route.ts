/**
 * @file app/api/gckb/public/ports/route.ts
 * @description Public, unauthenticated directory of published ports / points of
 * entry across all countries.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { listPortsDirectory } from '@/server/gckb/public-read';
import { optionalOrganizationId } from '@/server/gckb/optional-identity';

export const runtime = 'nodejs';
// A signed caller gets their own registry corrections, so the response varies by
// caller and must not be shared from a cache.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const items = await listPortsDirectory(optionalOrganizationId(req));
    return ok({ items, total: items.length });
  } catch (err) {
    return toErrorResponse(err);
  }
}
