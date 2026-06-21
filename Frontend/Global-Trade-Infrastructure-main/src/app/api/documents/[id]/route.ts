/**
 * @file app/api/documents/[id]/route.ts
 * @description A single vaulted document (tenant-scoped metadata record).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { documentsRequest } from '@/server/documents/http';
import { tradeDocumentService } from '@/server/services/trade-document-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = documentsRequest(req);
    const { id } = await ctx.params;
    return ok(await tradeDocumentService.getDocument(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
