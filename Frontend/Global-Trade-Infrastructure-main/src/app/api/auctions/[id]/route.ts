/**
 * @file app/api/auctions/[id]/route.ts
 * @description A single auction (tenant-scoped).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { auctionRequest } from '@/server/auction/http';
import { auctionService } from '@/server/services/auction-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = auctionRequest(req);
    const { id } = await ctx.params;
    return ok(await auctionService.getAuction(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
