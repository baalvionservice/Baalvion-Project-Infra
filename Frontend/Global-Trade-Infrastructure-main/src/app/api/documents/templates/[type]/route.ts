/**
 * @file app/api/documents/templates/[type]/route.ts
 * @description The full field schema (variables + sections + validations) for
 * one trade-document template — what the Document Center generation form
 * renders itself from. `tradeDocumentService.getTemplate` already existed but
 * was previously unwired to any route.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { documentsRequest } from '@/server/documents/http';
import { tradeDocumentService } from '@/server/services/trade-document-service';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ type: string }> }) {
  try {
    documentsRequest(req); // authenticate
    const { type } = await ctx.params;
    return ok(tradeDocumentService.getTemplate(type));
  } catch (err) {
    return toErrorResponse(err);
  }
}
