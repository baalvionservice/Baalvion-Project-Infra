/**
 * @file app/api/fx/quote/route.ts
 * @description FX quotes — create a priced quote (mid + spread/margin → all-in
 * rate, with TTL) and list quotes. Idempotent on `reference`.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { fxService } from '@/server/services/fx-service';
import { fxQuoteSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    return ok(
      await fxService.listQuotes(
        ctx,
        {
          status: url.searchParams.get('status') ?? undefined,
          baseCurrency: url.searchParams.get('baseCurrency') ?? undefined,
          quoteCurrency: url.searchParams.get('quoteCurrency') ?? undefined,
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
    rateLimit(clientKey(principal, 'fx-quote'), 600, 60_000);
    const body = fxQuoteSchema.parse(await req.json());
    return ok(await fxService.quote(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
