/**
 * @file app/api/gckb/search/route.ts
 * @description MODULE 8 — Global Search & Metadata API. One endpoint, three modes:
 *   ?mode=search   (default) — `?q=&entityType=a,b&domain=x&tag=t&status=&page=&pageSize=`
 *   ?mode=suggest  — type-ahead: `?q=<prefix>&limit=`
 *   ?mode=metadata — the entity-type catalog grouped by domain with live counts
 * Authentication + tenant scope come from the verified principal.
 */
import { ok, toErrorResponse, parsePagination } from '@/server/http/api';
import { kbRequest } from '@/server/gckb/http';
import { globalSearchService } from '@/server/gckb/global-search';

export const runtime = 'nodejs';

function csv(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

export async function GET(req: Request) {
  try {
    const { ctx: actor } = kbRequest(req);
    const url = new URL(req.url);
    const q = url.searchParams;
    const mode = q.get('mode') ?? 'search';

    if (mode === 'metadata') {
      return ok(await globalSearchService.metadata(actor.organizationId));
    }
    if (mode === 'suggest') {
      const limit = q.get('limit') ? Number(q.get('limit')) : undefined;
      return ok(await globalSearchService.suggest(actor.organizationId, q.get('q') ?? '', limit));
    }

    const { page, pageSize } = parsePagination(url);
    const result = await globalSearchService.search(actor.organizationId, {
      keyword: q.get('q') ?? undefined,
      entityTypes: csv(q.get('entityType')),
      domains: csv(q.get('domain')),
      tags: csv(q.get('tag')),
      status: q.get('status') ?? undefined,
      page,
      pageSize,
    });
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
