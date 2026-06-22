/**
 * @file app/api/settlements/[id]/history/route.ts
 * @description The immutable forensic timeline of a settlement instruction
 * (every create/transition from the audit trail).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { settlementService } from '@/server/services/settlement-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = ledgerRequest(req);
    const { id } = await ctx.params;
    return ok(await settlementService.getHistory(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
