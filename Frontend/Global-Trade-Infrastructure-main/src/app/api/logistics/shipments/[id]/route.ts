/**
 * @file app/api/logistics/shipments/[id]/route.ts
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { logisticsRequest } from '@/server/logistics/http';
import { logisticsService } from '@/server/services/logistics-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = logisticsRequest(req);
    const { id } = await ctx.params;
    return ok(await logisticsService.getShipment(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
