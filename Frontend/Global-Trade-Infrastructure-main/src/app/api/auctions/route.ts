/**
 * @file app/api/auctions/route.ts
 * @description Auction collection: list (tenant-scoped, filtered) and create.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { auctionRequest } from '@/server/auction/http';
import { auctionService } from '@/server/services/auction-service';
import { createAuctionSchema } from '@/server/auction/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = auctionRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const result = await auctionService.listAuctions(
      ctx,
      {
        status: url.searchParams.get('status') ?? undefined,
        type: url.searchParams.get('type') ?? undefined,
        tradeId: url.searchParams.get('tradeId') ?? undefined,
        currency: url.searchParams.get('currency') ?? undefined,
        sellerOrgId: url.searchParams.get('sellerOrgId') ?? undefined,
        search: url.searchParams.get('search') ?? undefined,
      },
      { page, pageSize },
    );
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const { principal, ctx } = auctionRequest(req);
    rateLimit(clientKey(principal, 'auction-write'), 60, 60_000);
    const body = createAuctionSchema.parse(await req.json());
    const auction = await auctionService.createAuction(ctx, body);
    return ok(auction, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
