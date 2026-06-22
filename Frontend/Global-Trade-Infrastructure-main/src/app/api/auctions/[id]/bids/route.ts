/**
 * @file app/api/auctions/[id]/bids/route.ts
 * @description The bid stream for an auction (GET) and placing a live bid (POST).
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { auctionRequest } from '@/server/auction/http';
import { auctionService } from '@/server/services/auction-service';
import { placeBidSchema } from '@/server/auction/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = auctionRequest(req);
    const { id } = await ctx.params;
    const { page, pageSize } = parsePagination(new URL(req.url));
    return ok(await auctionService.listBids(actor, id, { page, pageSize }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = auctionRequest(req);
    // Bidding is hot: a generous per-bidder window guards against runaway clients.
    rateLimit(clientKey(principal, 'auction-bid'), 240, 60_000);
    const { id } = await ctx.params;
    const body = placeBidSchema.parse(await req.json());
    const result = await auctionService.placeBid(actor, id, body);
    return ok(result, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
