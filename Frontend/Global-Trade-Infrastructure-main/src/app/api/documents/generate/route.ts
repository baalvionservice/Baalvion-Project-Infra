/**
 * @file app/api/documents/generate/route.ts
 * @description Generate a trade document (invoice, packing list, B/L, COO,
 * customs declaration) from data and deposit it in the tenant vault.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { documentsRequest } from '@/server/documents/http';
import { tradeDocumentService } from '@/server/services/trade-document-service';
import { generateDocumentSchema } from '@/server/documents/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { principal, ctx } = documentsRequest(req);
    rateLimit(clientKey(principal, 'document-generate'), 120, 60_000);
    const body = generateDocumentSchema.parse(await req.json());
    const result = await tradeDocumentService.generate(ctx, body);
    return ok(result, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
