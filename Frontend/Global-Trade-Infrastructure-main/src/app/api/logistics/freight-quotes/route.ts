/**
 * @file app/api/logistics/freight-quotes/route.ts
 * @description Freight quotes: list (filtered) and create (volumetric rating).
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { logisticsRequest } from '@/server/logistics/http';
import { logisticsService } from '@/server/services/logistics-service';
import { quoteFreightSchema } from '@/server/logistics/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = logisticsRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    return ok(
      await logisticsService.listQuotes(
        ctx,
        { status: url.searchParams.get('status') ?? undefined, mode: url.searchParams.get('mode') ?? undefined, carrierId: url.searchParams.get('carrierId') ?? undefined },
        { page, pageSize },
      ),
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const { principal, ctx } = logisticsRequest(req);
    rateLimit(clientKey(principal, 'logistics-quote'), 120, 60_000);
    const body = quoteFreightSchema.parse(await req.json());
    return ok(await logisticsService.quoteFreight(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
