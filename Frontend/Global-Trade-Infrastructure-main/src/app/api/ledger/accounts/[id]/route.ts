/**
 * @file app/api/ledger/accounts/[id]/route.ts
 * @description A single ledger account — read balance, or change status
 * (freeze / unfreeze / close).
 */
import { ok, fail, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { ledgerService } from '@/server/services/ledger-service';
import { setAccountStatusSchema } from '@/server/ledger/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = ledgerRequest(req);
    const { id } = await ctx.params;
    const account = await ledgerService.getAccount(actor, id);
    if (!account) return fail(404, `LedgerAccount_NOT_FOUND: ${id}`);
    return ok(account);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'ledger-write'), 120, 60_000);
    const { id } = await ctx.params;
    const body = setAccountStatusSchema.parse(await req.json());
    return ok(await ledgerService.setAccountStatus(actor, id, body.status, body.reason));
  } catch (err) {
    return toErrorResponse(err);
  }
}
