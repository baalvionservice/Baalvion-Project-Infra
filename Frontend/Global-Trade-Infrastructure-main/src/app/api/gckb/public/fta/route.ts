/**
 * @file app/api/gckb/public/fta/route.ts
 * @description Public, unauthenticated list of published trade agreements / FTAs.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { listAgreements } from '@/server/gckb/public-read';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  try {
    const items = await listAgreements();
    return ok({ items, total: items.length });
  } catch (err) {
    return toErrorResponse(err);
  }
}
