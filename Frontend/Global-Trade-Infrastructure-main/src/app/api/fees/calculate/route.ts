/**
 * @file app/api/fees/calculate/route.ts
 * @description Calculate the fee a rule would charge on a base amount (no write).
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { feeService } from '@/server/services/fee-service';
import { calculateFeeSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'fee-calc'), 600, 60_000);
    const body = calculateFeeSchema.parse(await req.json());
    return ok(await feeService.calculate(ctx, body.feeRuleId, body.baseAmount, body.currency));
  } catch (err) {
    return toErrorResponse(err);
  }
}
