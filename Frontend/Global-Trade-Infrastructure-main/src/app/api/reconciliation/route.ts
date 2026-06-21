/**
 * @file app/api/reconciliation/route.ts
 * @description Reconciliation reports — prove derived/cached numbers agree with
 * the immutable ledger. ?walletId reconciles one wallet's projection; ?accountId
 * reconciles one ledger account; otherwise the whole ledger (optionally
 * filtered by ?currency).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { reconciliationService } from '@/server/services/reconciliation-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    const walletId = url.searchParams.get('walletId');
    const accountId = url.searchParams.get('accountId');
    if (walletId) return ok(await reconciliationService.reconcileWallet(ctx, walletId));
    if (accountId) return ok(await reconciliationService.reconcileAccount(ctx, accountId));
    return ok(await reconciliationService.reconcileLedger(ctx, url.searchParams.get('currency') ?? undefined));
  } catch (err) {
    return toErrorResponse(err);
  }
}
