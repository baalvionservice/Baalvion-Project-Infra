/**
 * @file app/api/wallets/[id]/route.ts
 * @description A single wallet — read derived balances (available / held /
 * reserved / pending / incoming / outgoing / projected / total), or change
 * status (freeze / unfreeze / close).
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { projectionService } from '@/server/services/projection-service';
import { walletService } from '@/server/services/wallet-service';
import { setWalletStatusSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = ledgerRequest(req);
    const { id } = await ctx.params;
    const wallet = await walletService.getWallet(actor, id);
    const balances = await projectionService.getBalances(actor, id);
    return ok({ wallet, balances: balances.balances, projection: balances.projection });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'wallet-write'), 120, 60_000);
    const { id } = await ctx.params;
    const body = setWalletStatusSchema.parse(await req.json());
    return ok(await walletService.setStatus(actor, id, body.status, body.reason));
  } catch (err) {
    return toErrorResponse(err);
  }
}
