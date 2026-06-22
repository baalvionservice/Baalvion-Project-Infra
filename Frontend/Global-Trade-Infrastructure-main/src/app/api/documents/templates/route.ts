/**
 * @file app/api/documents/templates/route.ts
 * @description The catalogue of available trade-document templates.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { documentsRequest } from '@/server/documents/http';
import { tradeDocumentService } from '@/server/services/trade-document-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    documentsRequest(req); // authenticate
    return ok(tradeDocumentService.listTemplates());
  } catch (err) {
    return toErrorResponse(err);
  }
}
