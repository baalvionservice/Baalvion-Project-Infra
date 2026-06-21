/**
 * @file app/api/wallets/[id]/operations/route.ts
 * @description Apply a wallet operation (credit / debit / hold / release /
 * reserve / unreserve / mark-pending / clear-pending). Each is a balanced ledger
 * posting that refreshes the cached projection atomically. Idempotent on `reference`.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { walletService } from '@/server/services/wallet-service';
import { walletOperationSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'wallet-op'), 300, 60_000);
    const { id } = await ctx.params;
    const body = walletOperationSchema.parse(await req.json());
    return ok(await walletService.operate(actor, id, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}
