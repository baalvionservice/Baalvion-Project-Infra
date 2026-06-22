/**
 * @file app/api/logistics/warehouses/route.ts
 * @description Warehouses: list (filtered) and create.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { logisticsRequest } from '@/server/logistics/http';
import { logisticsService } from '@/server/services/logistics-service';
import { createWarehouseSchema } from '@/server/logistics/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = logisticsRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    return ok(
      await logisticsService.listWarehouses(
        ctx,
        { type: url.searchParams.get('type') ?? undefined, country: url.searchParams.get('country') ?? undefined, status: url.searchParams.get('status') ?? undefined, search: url.searchParams.get('search') ?? undefined },
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
    const body = createWarehouseSchema.parse(await req.json());
    return ok(await logisticsService.createWarehouse(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
