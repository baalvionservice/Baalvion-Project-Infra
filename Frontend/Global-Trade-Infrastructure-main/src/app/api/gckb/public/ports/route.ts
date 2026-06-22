/**
 * @file app/api/gckb/public/ports/route.ts
 * @description Public, unauthenticated directory of published ports / points of
 * entry across all countries.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { listPortsDirectory } from '@/server/gckb/public-read';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  try {
    const items = await listPortsDirectory();
    return ok({ items, total: items.length });
  } catch (err) {
    return toErrorResponse(err);
  }
}
