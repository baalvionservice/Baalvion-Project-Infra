/**
 * @file app/api/logistics/carriers/route.ts
 * @description Carriers: list (filtered) and create.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { logisticsRequest } from '@/server/logistics/http';
import { logisticsService } from '@/server/services/logistics-service';
import { createCarrierSchema } from '@/server/logistics/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = logisticsRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    return ok(
      await logisticsService.listCarriers(
        ctx,
        { mode: url.searchParams.get('mode') ?? undefined, status: url.searchParams.get('status') ?? undefined, search: url.searchParams.get('search') ?? undefined },
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
    rateLimit(clientKey(principal, 'logistics-write'), 120, 60_000);
    const body = createCarrierSchema.parse(await req.json());
    return ok(await logisticsService.createCarrier(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
