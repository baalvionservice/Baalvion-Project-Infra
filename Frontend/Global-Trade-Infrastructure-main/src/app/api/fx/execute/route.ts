/**
 * @file app/api/fx/execute/route.ts
 * @description Execute an FX quote: convert base → quote as two balanced,
 * single-currency ledger postings (base wallet → FX clearing, FX clearing →
 * quote wallet) and record the trade. A quote executes at most once.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { fxService } from '@/server/services/fx-service';
import { fxExecuteSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'fx-execute'), 300, 60_000);
    const body = fxExecuteSchema.parse(await req.json());
    return ok(await fxService.execute(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
