/**
 * @file app/api/gckb/public/authorities/route.ts
 * @description Public, unauthenticated directory of published government / customs
 * authorities across all countries.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { listAuthoritiesDirectory } from '@/server/gckb/public-read';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  try {
    const items = await listAuthoritiesDirectory();
    return ok({ items, total: items.length });
  } catch (err) {
    return toErrorResponse(err);
  }
}
