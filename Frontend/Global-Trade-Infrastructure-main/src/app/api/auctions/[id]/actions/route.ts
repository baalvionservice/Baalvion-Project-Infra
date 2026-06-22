/**
 * @file app/api/auctions/[id]/actions/route.ts
 * @description Drive an auction through a lifecycle action: open | close |
 * settle | cancel. Closing selects the winner; settling posts to the ledger.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { auctionRequest } from '@/server/auction/http';
import { auctionService } from '@/server/services/auction-service';
import { auctionActionSchema } from '@/server/auction/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = auctionRequest(req);
    rateLimit(clientKey(principal, 'auction-action'), 60, 60_000);
    const { id } = await ctx.params;
    const body = auctionActionSchema.parse(await req.json());
    const result = await auctionService.transition(actor, id, body);
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
