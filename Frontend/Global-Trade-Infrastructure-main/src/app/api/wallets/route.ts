/**
 * @file app/api/wallets/route.ts
 * @description Wallets — list (filter) and open. Opening provisions the four
 * bucket ledger accounts atomically. Idempotent on `reference`.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { walletService } from '@/server/services/wallet-service';
import { openWalletSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    return ok(
      await walletService.listWallets(
        ctx,
        {
          type: url.searchParams.get('type') ?? undefined,
          currency: url.searchParams.get('currency') ?? undefined,
          ownerOrgId: url.searchParams.get('ownerOrgId') ?? undefined,
          status: url.searchParams.get('status') ?? undefined,
        },
        { page, pageSize },
      ),
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'wallet-write'), 120, 60_000);
    const body = openWalletSchema.parse(await req.json());
    return ok(await walletService.openWallet(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
