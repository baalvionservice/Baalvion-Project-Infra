/**
 * @file app/api/fees/apply/route.ts
 * @description Charge a fee — compute it and post payer → fee-income on the
 * ledger, recording an append-only fee transaction. Idempotent on `reference`.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { feeService } from '@/server/services/fee-service';
import { applyFeeSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'fee-apply'), 300, 60_000);
    const body = applyFeeSchema.parse(await req.json());
    return ok(await feeService.applyFee(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
