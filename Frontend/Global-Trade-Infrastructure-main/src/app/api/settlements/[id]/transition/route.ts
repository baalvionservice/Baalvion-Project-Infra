/**
 * @file app/api/settlements/[id]/transition/route.ts
 * @description Drive a settlement instruction through one state transition
 * (authorize / capture / settle / fail / cancel / reverse). The state change and
 * the implied ledger posting commit atomically.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { settlementService } from '@/server/services/settlement-service';
import { transitionSettlementSchema } from '@/server/ledger/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'settlement-transition'), 300, 60_000);
    const { id } = await ctx.params;
    const body = transitionSettlementSchema.parse(await req.json());
    return ok(await settlementService.transition(actor, id, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}
