/**
 * @file app/api/gckb/public/vessel-classes/route.ts
 * @description The container-ship classes a corridor can be checked against. Static
 * reference data, so it is cacheable and needs no principal.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { listVesselClasses } from '@/server/gckb/corridor';

export const runtime = 'nodejs';
export const revalidate = 3600;

export async function GET() {
  try {
    return ok({ items: listVesselClasses() });
  } catch (err) {
    return toErrorResponse(err);
  }
}
