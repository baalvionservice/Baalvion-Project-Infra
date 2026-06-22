/**
 * @file app/api/treasury/accounts/route.ts
 * @description Treasury accounts — list, and provision (idempotent) a named
 * treasury account (kind, currency) backed by a ledger account.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { ledgerRequest } from '@/server/ledger/http';
import { treasuryAccountService } from '@/server/services/treasury-account-service';
import { provisionTreasuryAccountSchema } from '@/server/treasury/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = ledgerRequest(req);
    const url = new URL(req.url);
    return ok(await treasuryAccountService.list(ctx, { kind: url.searchParams.get('kind') ?? undefined, currency: url.searchParams.get('currency') ?? undefined }));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const { principal, ctx } = ledgerRequest(req);
    rateLimit(clientKey(principal, 'treasury-write'), 120, 60_000);
    const body = provisionTreasuryAccountSchema.parse(await req.json());
    return ok(await treasuryAccountService.provision(ctx, body.kind, body.currency), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
