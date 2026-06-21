/**
 * @file app/api/settlements/route.ts
 * @description Settlement instructions — list (filter) and create.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { settlementService } from '@/server/services/settlement-service';
import { createSettlementSchema } from '@/server/ledger/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const result = await settlementService.listInstructions(
      ctx,
      {
        status: url.searchParams.get('status') ?? undefined,
        rail: url.searchParams.get('rail') ?? undefined,
        tradeId: url.searchParams.get('tradeId') ?? undefined,
        currency: url.searchParams.get('currency') ?? undefined,
      },
      { page, pageSize },
    );
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'settlement-write'), 120, 60_000);
    const body = createSettlementSchema.parse(await req.json());
    return ok(await settlementService.createInstruction(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
