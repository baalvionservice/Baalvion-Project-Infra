/**
 * @file app/api/ledger/transactions/route.ts
 * @description Ledger transactions — list, and post a balanced journal entry.
 * Posting is idempotent on `reference` when supplied.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { ledgerService } from '@/server/services/ledger-service';
import { postJournalSchema } from '@/server/ledger/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const result = await ledgerService.listTransactions(
      ctx,
      {
        status: url.searchParams.get('status') ?? undefined,
        tradeId: url.searchParams.get('tradeId') ?? undefined,
        correlationId: url.searchParams.get('correlationId') ?? undefined,
        currency: url.searchParams.get('currency') ?? undefined,
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
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'ledger-post'), 300, 60_000);
    const body = postJournalSchema.parse(await req.json());
    return ok(await ledgerService.postJournal(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
