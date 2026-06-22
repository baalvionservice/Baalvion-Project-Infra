/**
 * @file app/api/gckb/[entity]/[id]/history/route.ts
 * @description Append-only revision history for a GCKB record (newest first).
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
    return ok(await gckbService.history(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
