/**
 * @file app/api/logistics/shipments/[id]/tracking/route.ts
 * @description The append-only tracking timeline of a shipment (GET) and adding
 * a tracking event (POST), which may advance the shipment's status.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { logisticsRequest } from '@/server/logistics/http';
import { logisticsService } from '@/server/services/logistics-service';
import { trackingEventSchema } from '@/server/logistics/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = logisticsRequest(req);
    const { id } = await ctx.params;
    const { page, pageSize } = parsePagination(new URL(req.url));
    return ok(await logisticsService.listTracking(actor, id, { page, pageSize }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = logisticsRequest(req);
    rateLimit(clientKey(principal, 'logistics-track'), 240, 60_000);
    const { id } = await ctx.params;
    const body = trackingEventSchema.parse(await req.json());
    return ok(await logisticsService.addTrackingEvent(actor, id, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
