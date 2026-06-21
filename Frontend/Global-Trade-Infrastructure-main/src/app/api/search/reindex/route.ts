/**
 * @file app/api/search/reindex/route.ts
 * @description PROMPT 8 — rebuild the external search index from the catalogue.
 * Privileged (platform/admin role); a no-op for the Postgres parity backend.
 *   POST /api/search/reindex  { "batchSize"?: number }
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { reindexPrincipal } from '@/server/search/http';
import { reindexSchema } from '@/server/search/schemas';
import { searchService } from '@/server/search/search-service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const principal = reindexPrincipal(req);
    rateLimit(clientKey(principal, 'search-reindex'), 5, 60_000);
    const body = reindexSchema.parse(await req.json().catch(() => ({})));
    const result = await searchService.reindex(principal.organizationId, body);
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
