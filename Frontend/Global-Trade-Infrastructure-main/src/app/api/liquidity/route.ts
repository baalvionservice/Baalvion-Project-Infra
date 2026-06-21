/**
 * @file app/api/liquidity/route.ts
 * @description Liquidity — GET live positions (all currencies, or one via
 * ?currency); POST persists an append-only liquidity snapshot for a currency.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { liquidityService } from '@/server/services/liquidity-service';
import { liquiditySnapshotSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const currency = new URL(req.url).searchParams.get('currency');
    if (currency) return ok(await liquidityService.computeLive(ctx, currency));
    return ok(await liquidityService.computeAll(ctx));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'liquidity-write'), 120, 60_000);
    const body = liquiditySnapshotSchema.parse(await req.json());
    return ok(await liquidityService.snapshot(ctx, body.currency), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
