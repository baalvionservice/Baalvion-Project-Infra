/**
 * @file app/api/gckb/public/compare/route.ts
 * @description Public side-by-side comparison of 2–4 countries' published trade
 * posture (policy counts by group, headline taxes, agreements, ports). Codes are
 * passed as a comma-separated `codes` query parameter.
 */
import { ok, fail, toErrorResponse } from '@/server/http/api';
import { compareCountries } from '@/server/gckb/public-read';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(req: Request) {
  try {
    const codes = (new URL(req.url).searchParams.get('codes') ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (codes.length < 2) return fail(400, 'Provide at least two country codes, e.g. ?codes=IN,AE');
    const comparison = await compareCountries(codes);
    return ok(comparison);
  } catch (err) {
    return toErrorResponse(err);
  }
}
