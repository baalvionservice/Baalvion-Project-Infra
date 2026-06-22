/**
 * @file app/api/ledger/accounts/route.ts
 * @description Ledger accounts collection — list (filter/search) and open.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { ledgerService } from '@/server/services/ledger-service';
import { openAccountSchema } from '@/server/ledger/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const result = await ledgerService.listAccounts(
      ctx,
      {
        purpose: url.searchParams.get('purpose') ?? undefined,
        type: url.searchParams.get('type') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        currency: url.searchParams.get('currency') ?? undefined,
        ownerOrgId: url.searchParams.get('ownerOrgId') ?? undefined,
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
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'ledger-write'), 120, 60_000);
    const body = openAccountSchema.parse(await req.json());
    return ok(await ledgerService.openAccount(ctx, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
