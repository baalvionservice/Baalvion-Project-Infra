/**
 * @file app/api/logistics/containers/[id]/allocate/route.ts
 * @description Allocate/move a container to a shipment and/or warehouse and set
 * its status.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { logisticsRequest } from '@/server/logistics/http';
import { logisticsService } from '@/server/services/logistics-service';
import { allocateContainerSchema } from '@/server/logistics/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = logisticsRequest(req);
    rateLimit(clientKey(principal, 'logistics-write'), 120, 60_000);
    const { id } = await ctx.params;
    const body = allocateContainerSchema.parse(await req.json());
    return ok(await logisticsService.allocateContainer(actor, id, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}
