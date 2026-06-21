/**
 * @file app/api/ledger/transactions/[id]/reverse/route.ts
 * @description Reverse a posted transaction by writing its mirror image. The
 * original is never edited or deleted — the two are linked for an auditable
 * correction trail.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { ledgerService } from '@/server/services/ledger-service';
import { z } from 'zod';

export const runtime = 'nodejs';

const reverseSchema = z.object({ reason: z.string().max(500).optional() });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { principal, ctx: actor } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'ledger-post'), 300, 60_000);
    const { id } = await ctx.params;
    const body = reverseSchema.parse(await req.json().catch(() => ({})));
    return ok(await ledgerService.reverseTransaction(actor, id, body.reason), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
