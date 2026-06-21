/**
 * @file app/api/auctions/[id]/events/route.ts
 * @description The append-only forensic event log of an auction (every bid,
 * proxy raise, anti-snipe extension and state transition).
 */
import { ok, toErrorResponse, parsePagination } from '@/server/http/api';
import { auctionRequest } from '@/server/auction/http';
import { auctionService } from '@/server/services/auction-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = auctionRequest(req);
    const { id } = await ctx.params;
    const { page, pageSize } = parsePagination(new URL(req.url));
    return ok(await auctionService.listEvents(actor, id, { page, pageSize }));
  } catch (err) {
    return toErrorResponse(err);
  }
}
