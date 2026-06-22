/**
 * @file app/api/ledger/transactions/[id]/route.ts
 * @description A single ledger transaction with its append-only entries.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { ledgerService } from '@/server/services/ledger-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = ledgerRequest(req);
    const { id } = await ctx.params;
    return ok(await ledgerService.getTransaction(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
