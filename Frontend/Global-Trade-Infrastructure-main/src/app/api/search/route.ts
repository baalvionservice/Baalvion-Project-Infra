/**
 * @file app/api/search/route.ts
 * @description PROMPT 8 — marketplace search: full-text + Country/Price/Category
 * facets, tenant-scoped to the verified principal.
 *   GET /api/search?q=&country=IN,CN&category=&minPrice=&maxPrice=&sort=&page=&pageSize=
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { searchRequest } from '@/server/search/http';
import { parseSearchQuery } from '@/server/search/schemas';
import { searchService } from '@/server/search/search-service';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { principal } = searchRequest(req);
    rateLimit(clientKey(principal, 'search-read'), 120, 60_000);
    const query = parseSearchQuery(new URL(req.url));
    const result = await searchService.search(principal.organizationId, query);
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
