/**
 * @file app/api/logistics/freight-quotes/[id]/accept/route.ts
 * @description Accept a freight quote (optionally binding it to a shipment).
 */
import { z } from 'zod';
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { logisticsRequest } from '@/server/logistics/http';
import { logisticsService } from '@/server/services/logistics-service';

export const runtime = 'nodejs';

const acceptSchema = z.object({ shipmentId: z.string().uuid().optional() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = logisticsRequest(req);
    rateLimit(clientKey(principal, 'logistics-write'), 120, 60_000);
    const { id } = await ctx.params;
    const body = acceptSchema.parse(await req.json().catch(() => ({})));
    return ok(await logisticsService.acceptQuote(actor, id, body.shipmentId));
  } catch (err) {
    return toErrorResponse(err);
  }
}
