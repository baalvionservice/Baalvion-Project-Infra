/**
 * @file app/api/gckb/[entity]/[id]/versions/route.ts
 * @description Versions of a record. With ?a=&b= returns two snapshots for
 * side-by-side comparison; otherwise lists all versions (newest first).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { kbRequest, assertEntity } from '@/server/gckb/http';
import { gckbService } from '@/server/services/gckb-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const { ctx: actor } = kbRequest(req);
    const { entity, id } = await ctx.params;
    assertEntity(entity);
    const url = new URL(req.url);
    const a = url.searchParams.get('a');
    const b = url.searchParams.get('b');
    if (a && b) {
      return ok(await gckbService.compareVersions(actor, id, Number(a), Number(b)));
    }
    return ok(await gckbService.versions(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
