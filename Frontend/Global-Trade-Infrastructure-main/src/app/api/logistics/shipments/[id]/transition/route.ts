/**
 * @file app/api/logistics/shipments/[id]/transition/route.ts
 * @description Drive a shipment through a status transition (graph-guarded).
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { logisticsRequest } from '@/server/logistics/http';
import { logisticsService } from '@/server/services/logistics-service';
import { shipmentTransitionSchema } from '@/server/logistics/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = logisticsRequest(req);
    rateLimit(clientKey(principal, 'logistics-write'), 120, 60_000);
    const { id } = await ctx.params;
    const body = shipmentTransitionSchema.parse(await req.json());
    return ok(await logisticsService.transitionShipment(actor, id, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}
