/**
 * @file app/api/gckb/public/countries/[code]/route.ts
 * @description Public, unauthenticated country profile — the country plus every
 * published policy (grouped), its authorities, ports and the trade agreements it
 * is party to. Published global baseline only.
 */
import { ok, fail, toErrorResponse } from '@/server/http/api';
import { getCountryProfile } from '@/server/gckb/public-read';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await ctx.params;
    const profile = await getCountryProfile(code);
    if (!profile) return fail(404, `Country "${code}" is not published in the knowledge base`);
    return ok(profile);
  } catch (err) {
    return toErrorResponse(err);
  }
}
