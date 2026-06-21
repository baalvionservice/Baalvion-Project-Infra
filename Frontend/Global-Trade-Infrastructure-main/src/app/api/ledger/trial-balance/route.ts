/**
 * @file app/api/ledger/trial-balance/route.ts
 * @description Trial balance for the tenant — every account split into its
 * debit/credit column with per-currency totals and a `balanced` flag.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { ledgerService } from '@/server/services/ledger-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const currency = new URL(req.url).searchParams.get('currency') ?? undefined;
    return ok(await ledgerService.getTrialBalance(ctx, currency));
  } catch (err) {
    return toErrorResponse(err);
  }
}
