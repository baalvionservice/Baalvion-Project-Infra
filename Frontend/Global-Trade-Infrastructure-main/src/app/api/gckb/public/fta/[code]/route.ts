/**
 * @file app/api/gckb/public/fta/[code]/route.ts
 * @description Public trade-agreement detail — members + the preferential tariff
 * lines granted under the agreement (rules-of-origin → duty-preference view).
 */
import { ok, fail, toErrorResponse } from '@/server/http/api';
import { getAgreementDetail } from '@/server/gckb/public-read';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const detail = await getAgreementDetail(code);
    if (!detail) return fail(404, `Trade agreement "${code}" is not published`);
    return ok(detail);
  } catch (err) {
    return toErrorResponse(err);
  }
}
