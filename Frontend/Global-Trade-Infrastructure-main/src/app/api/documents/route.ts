/**
 * @file app/api/documents/route.ts
 * @description The tenant document vault: list stored documents (filtered).
 */
import { ok, toErrorResponse, parsePagination } from '@/server/http/api';
import { documentsRequest } from '@/server/documents/http';
import { tradeDocumentService } from '@/server/services/trade-document-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { ctx } = documentsRequest(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const result = await tradeDocumentService.listVault(
      ctx,
      {
        kind: url.searchParams.get('kind') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        tradeId: url.searchParams.get('tradeId') ?? undefined,
      },
      { page, pageSize },
    );
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
