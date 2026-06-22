/**
 * @file app/api/ledger/accounts/[id]/entries/route.ts
 * @description Append-only entry history (statement) for one ledger account.
 */
import { ok, toErrorResponse, parsePagination } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { ledgerService } from '@/server/services/ledger-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = ledgerRequest(req);
    const { id } = await ctx.params;
    const { page, pageSize } = parsePagination(new URL(req.url));
    return ok(await ledgerService.listAccountEntries(actor, id, { page, pageSize }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
