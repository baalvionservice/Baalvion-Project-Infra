/**
 * @file app/api/search/suggest/route.ts
 * @description PROMPT 8 — type-ahead suggestions for the search box.
 *   GET /api/search/suggest?q=<prefix>&limit=10
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { searchRequest } from '@/server/search/http';
import { searchService } from '@/server/search/search-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { principal } = searchRequest(req);
    rateLimit(clientKey(principal, 'search-suggest'), 240, 60_000);
    const url = new URL(req.url);
    const prefix = url.searchParams.get('q') ?? '';
    const limit = Number(url.searchParams.get('limit') ?? '10') || 10;
    const result = await searchService.suggest(principal.organizationId, prefix, limit);
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
