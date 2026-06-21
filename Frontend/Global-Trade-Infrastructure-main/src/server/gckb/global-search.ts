/**
 * @file server/gckb/global-search.ts
 * @description MODULE 8 — Global Search & Metadata. A single search surface across
 * every registry entity (products, organizations, countries, HS codes,
 * certificates, documents, workflows, authorities, ports, policies, …) — all of
 * which already live in `gckb_records`. Provides relevance ranking, entity-type +
 * domain facets, type-ahead suggestions and a self-describing metadata catalog.
 * Reuses the generic store; introduces no parallel search index.
 */
import { GckbRecord } from '@prisma/client';
import { globalSearchRepository, GlobalSearchFilter } from '../repositories/global-search-repository';
import { getEntityDefinition, listEntityTypes } from './registry';

const CANDIDATE_CAP = 500;

export interface SearchHit {
  id: string;
  entityType: string;
  domain: string | null;
  recordKey: string;
  name: string;
  code: string | null;
  hsCode: string | null;
  productCategory: string | null;
  tags: string[];
  status: string;
  score: number;
  updatedAt: string;
}

export interface SearchFacet {
  key: string;
  label: string;
  count: number;
}

export interface SearchResult {
  items: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  facets: { entityType: SearchFacet[]; domain: SearchFacet[] };
  /** True when more than CANDIDATE_CAP records matched (deep pages fall back to recency). */
  capped: boolean;
}

export interface SearchQuery {
  keyword?: string;
  entityTypes?: string[];
  domains?: string[];
  tags?: string[];
  status?: string;
  page?: number;
  pageSize?: number;
}

function domainOf(entityType: string): string | null {
  return getEntityDefinition(entityType)?.domain ?? null;
}

function labelOf(entityType: string): string {
  return getEntityDefinition(entityType)?.label ?? entityType;
}

/** Resolve `domains` into the concrete entity types they contain, merged with explicit types. */
function resolveEntityTypes(query: SearchQuery): string[] | undefined {
  const fromDomains = query.domains && query.domains.length
    ? listEntityTypes().filter((t) => query.domains!.includes(domainOf(t) ?? ''))
    : [];
  const merged = [...new Set([...(query.entityTypes ?? []), ...fromDomains])];
  return merged.length ? merged : undefined;
}

function scoreOf(record: GckbRecord, kwLower: string): number {
  if (!kwLower) return 0;
  const name = record.name.toLowerCase();
  let s = 0;
  if (name === kwLower) s += 100;
  else if (name.startsWith(kwLower)) s += 60;
  else if (name.includes(kwLower)) s += 40;
  if ((record.recordKey ?? '').toLowerCase().includes(kwLower)) s += 20;
  if ((record.code ?? '').toLowerCase().includes(kwLower)) s += 20;
  if ((record.hsCode ?? '').toLowerCase().includes(kwLower)) s += 15;
  if ((record.productCategory ?? '').toLowerCase().includes(kwLower)) s += 10;
  if ((record.tags ?? []).some((t) => t.toLowerCase() === kwLower)) s += 15;
  return s;
}

function toHit(record: GckbRecord, score: number): SearchHit {
  return {
    id: record.id,
    entityType: record.entityType,
    domain: domainOf(record.entityType),
    recordKey: record.recordKey,
    name: record.name,
    code: record.code,
    hsCode: record.hsCode,
    productCategory: record.productCategory,
    tags: record.tags ?? [],
    status: record.status,
    score,
    updatedAt: record.updatedAt.toISOString(),
  };
}

export const globalSearchService = {
  async search(organizationId: string | null, query: SearchQuery): Promise<SearchResult> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const filter: GlobalSearchFilter = {
      keyword: query.keyword?.trim() || undefined,
      entityTypes: resolveEntityTypes(query),
      tags: query.tags,
      status: query.status,
    };

    const [candidates, total, typeFacets] = await Promise.all([
      globalSearchRepository.candidates(organizationId, filter, CANDIDATE_CAP),
      globalSearchRepository.count(organizationId, filter),
      globalSearchRepository.facetByEntityType(organizationId, filter),
    ]);

    const kwLower = (filter.keyword ?? '').toLowerCase();
    const ranked = candidates
      .map((r) => ({ r, score: scoreOf(r, kwLower) }))
      .sort((a, b) => b.score - a.score || b.r.updatedAt.getTime() - a.r.updatedAt.getTime());

    const start = (page - 1) * pageSize;
    const items = ranked.slice(start, start + pageSize).map(({ r, score }) => toHit(r, score));

    const entityType: SearchFacet[] = typeFacets
      .map((f) => ({ key: f.entityType, label: labelOf(f.entityType), count: f.count }))
      .sort((a, b) => b.count - a.count);

    const domainCounts = new Map<string, number>();
    for (const f of typeFacets) {
      const d = domainOf(f.entityType) ?? 'other';
      domainCounts.set(d, (domainCounts.get(d) ?? 0) + f.count);
    }
    const domain: SearchFacet[] = [...domainCounts.entries()]
      .map(([key, count]) => ({ key, label: key, count }))
      .sort((a, b) => b.count - a.count);

    return { items, total, page, pageSize, facets: { entityType, domain }, capped: total > CANDIDATE_CAP };
  },

  async suggest(organizationId: string | null, prefix: string, limit = 10): Promise<Array<{ id: string; entityType: string; name: string; recordKey: string }>> {
    const trimmed = prefix.trim();
    if (!trimmed) return [];
    const rows = await globalSearchRepository.suggestions(organizationId, trimmed, Math.min(25, Math.max(1, limit)));
    return rows.map((r) => ({ id: r.id, entityType: r.entityType, name: r.name, recordKey: r.recordKey }));
  },

  /** A self-describing catalog: every registered entity type grouped by domain, with live counts. */
  async metadata(organizationId: string | null): Promise<{ domains: Array<{ domain: string; total: number; entityTypes: Array<{ entityType: string; label: string; count: number }> }> }> {
    const facets = await globalSearchRepository.facetByEntityType(organizationId, {});
    const counts = new Map(facets.map((f) => [f.entityType, f.count]));
    const byDomain = new Map<string, Array<{ entityType: string; label: string; count: number }>>();
    for (const entityType of listEntityTypes()) {
      const d = domainOf(entityType) ?? 'other';
      const list = byDomain.get(d) ?? [];
      list.push({ entityType, label: labelOf(entityType), count: counts.get(entityType) ?? 0 });
      byDomain.set(d, list);
    }
    const domains = [...byDomain.entries()]
      .map(([domain, entityTypes]) => ({ domain, total: entityTypes.reduce((s, e) => s + e.count, 0), entityTypes }))
      .sort((a, b) => a.domain.localeCompare(b.domain));
    return { domains };
  },
};
