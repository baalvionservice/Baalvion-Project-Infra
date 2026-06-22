/**
 * @file app/api/fees/route.ts
 * @description Fee rules — list and create.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { feeService } from '@/server/services/fee-service';
import { createFeeRuleSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    return ok(
      await feeService.listRules(
        ctx,
        { scope: url.searchParams.get('scope') ?? undefined, currency: url.searchParams.get('currency') ?? undefined, status: url.searchParams.get('status') ?? undefined },
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
    rateLimit(clientKey(principal, 'fee-write'), 120, 60_000);
    const body = createFeeRuleSchema.parse(await req.json());
    return ok(await feeService.createRule(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
