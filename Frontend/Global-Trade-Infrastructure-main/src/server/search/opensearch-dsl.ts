/**
 * @file server/search/opensearch-dsl.ts
 * @description PROMPT 8 — pure translation between the engine's `SearchQuery`/
 * `SearchResult` and the OpenSearch query DSL. Kept free of any client so the
 * exact request body and response mapping are unit-tested without a live cluster:
 * a full-text `multi_match` + tenant/scope `filter`, a `post_filter` for the
 * selected facets, and per-dimension `filter` aggregations that exclude their own
 * selection (matching the parity backend's faceting semantics).
 */
import {
  SearchDocument,
  SearchQuery,
  SearchHit,
  SearchFacets,
  FacetBucket,
  PriceFacetBucket,
  PRICE_BUCKETS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './types';

export const GLOBAL_TENANT = '__global__';

type Clause = Record<string, unknown>;

/** The indexed document — adds a `tenant` keyword so the scope filter is a term. */
export interface IndexDocument extends Omit<SearchDocument, never> {
  tenant: string;
}

export function toIndexDoc(doc: SearchDocument): IndexDocument {
  return { ...doc, tenant: doc.organizationId ?? GLOBAL_TENANT };
}

function tenantFilter(organizationId: string | null): Clause {
  const tenants = organizationId ? [organizationId, GLOBAL_TENANT] : [GLOBAL_TENANT];
  return { terms: { tenant: tenants } };
}

/** Filter clauses that are NOT part of `skip` (used to build per-facet agg filters). */
function facetFilters(query: SearchQuery, skip: 'country' | 'category' | 'price' | null): Clause[] {
  const filters: Clause[] = [];
  if (skip !== 'country' && query.countries?.length) {
    filters.push({ terms: { 'country.keyword': query.countries } });
  }
  if (skip !== 'category' && query.categories?.length) {
    filters.push({ terms: { 'category.keyword': query.categories } });
  }
  if (skip !== 'price' && (query.minPrice !== undefined || query.maxPrice !== undefined)) {
    const range: Clause = {};
    if (query.minPrice !== undefined) range.gte = query.minPrice;
    if (query.maxPrice !== undefined) range.lte = query.maxPrice;
    filters.push({ range: { price: range } });
  }
  return filters;
}

function keywordQuery(keyword: string | undefined): Clause {
  const kw = keyword?.trim();
  if (!kw) return { match_all: {} };
  return {
    multi_match: {
      query: kw,
      type: 'best_fields',
      fields: ['title^3', 'brand^2', 'category^2', 'tags^2', 'recordKey', 'hsCode', 'description', 'searchText'],
      fuzziness: 'AUTO',
      operator: 'and',
    },
  };
}

function sortClause(query: SearchQuery): unknown[] {
  switch (query.sort) {
    case 'price_asc':
      return [{ price: { order: 'asc', missing: '_last' } }, '_score'];
    case 'price_desc':
      return [{ price: { order: 'desc', missing: '_last' } }, '_score'];
    case 'newest':
      return [{ updatedAt: { order: 'desc' } }];
    default:
      return ['_score', { updatedAt: { order: 'desc' } }];
  }
}

function priceRanges(): Array<{ key: string; from?: number; to?: number }> {
  return PRICE_BUCKETS.map((b) => ({
    key: b.key,
    ...(b.from > 0 ? { from: b.from } : {}),
    ...(b.to !== null ? { to: b.to } : {}),
  }));
}

/** Build the full OpenSearch request body for a search query. */
export function buildSearchBody(organizationId: string | null, query: SearchQuery): Record<string, unknown> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));

  const filter: Clause[] = [tenantFilter(organizationId)];
  if (query.entityTypes?.length) filter.push({ terms: { 'entityType.keyword': query.entityTypes } });
  if (query.status) filter.push({ term: { 'status.keyword': query.status } });

  const aggFilter = (skip: 'country' | 'category' | 'price'): Clause => {
    const clauses = facetFilters(query, skip);
    return clauses.length ? { bool: { filter: clauses } } : { match_all: {} };
  };

  return {
    from: (page - 1) * pageSize,
    size: pageSize,
    track_total_hits: true,
    query: { bool: { must: keywordQuery(query.keyword), filter } },
    // post_filter narrows hits to the selected facets without affecting aggregations.
    post_filter: facetFilters(query, null).length ? { bool: { filter: facetFilters(query, null) } } : undefined,
    sort: sortClause(query),
    aggs: {
      country: { filter: aggFilter('country'), aggs: { values: { terms: { field: 'country.keyword', size: 200 } } } },
      category: { filter: aggFilter('category'), aggs: { values: { terms: { field: 'category.keyword', size: 200 } } } },
      price: { filter: aggFilter('price'), aggs: { ranges: { range: { field: 'price', keyed: true, ranges: priceRanges() } } } },
    },
  };
}

export function buildSuggestBody(prefix: string, limit: number): Record<string, unknown> {
  return {
    size: Math.min(25, Math.max(1, limit)),
    _source: ['id', 'entityType', 'title', 'recordKey'],
    query: {
      bool: {
        should: [
          { match_phrase_prefix: { title: { query: prefix } } },
          { prefix: { 'recordKey.keyword': prefix.toUpperCase() } },
        ],
        minimum_should_match: 1,
      },
    },
  };
}

// ── Response mapping ─────────────────────────────────────────────────────────

interface OsHit {
  _score: number | null;
  _source: Partial<SearchDocument>;
}

interface OsBucket {
  key: string;
  doc_count: number;
}

function hitToSearchHit(hit: OsHit): SearchHit {
  const s = hit._source;
  return {
    id: s.id ?? '',
    entityType: s.entityType ?? '',
    domain: s.domain ?? null,
    recordKey: s.recordKey ?? '',
    title: s.title ?? '',
    description: s.description ?? null,
    category: s.category ?? null,
    country: s.country ?? null,
    price: s.price ?? null,
    currency: s.currency ?? null,
    brand: s.brand ?? null,
    hsCode: s.hsCode ?? null,
    tags: s.tags ?? [],
    status: s.status ?? '',
    imageUrl: s.imageUrl ?? null,
    updatedAt: s.updatedAt ?? '',
    score: hit._score ?? 0,
  };
}

function termBuckets(agg: unknown, selected: string[]): FacetBucket[] {
  const sel = new Set(selected);
  const buckets =
    (agg as { values?: { buckets?: OsBucket[] } } | undefined)?.values?.buckets ?? [];
  return buckets
    .map((b) => ({ key: b.key, label: b.key, count: b.doc_count, selected: sel.has(b.key) }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function priceBuckets(agg: unknown, query: SearchQuery): PriceFacetBucket[] {
  const keyed =
    (agg as { ranges?: { buckets?: Record<string, { doc_count: number }> } } | undefined)?.ranges?.buckets ?? {};
  const hasFilter = query.minPrice !== undefined || query.maxPrice !== undefined;
  return PRICE_BUCKETS.map((b) => {
    const selected =
      hasFilter &&
      (query.minPrice ?? b.from) === b.from &&
      (query.maxPrice ?? (b.to ?? Infinity)) === (b.to ?? Infinity);
    return { key: b.key, label: b.label, from: b.from, to: b.to, count: keyed[b.key]?.doc_count ?? 0, selected };
  });
}

export interface ParsedResponse {
  items: SearchHit[];
  total: number;
  facets: SearchFacets;
}

/** Map a raw OpenSearch search response into the engine's result shape. */
export function parseSearchResponse(resp: unknown, query: SearchQuery): ParsedResponse {
  const r = (resp ?? {}) as {
    hits?: { total?: { value?: number } | number; hits?: OsHit[] };
    aggregations?: Record<string, unknown>;
  };
  const rawTotal = r.hits?.total;
  const total = typeof rawTotal === 'number' ? rawTotal : rawTotal?.value ?? 0;
  const items = (r.hits?.hits ?? []).map(hitToSearchHit);
  const aggs = r.aggregations ?? {};
  return {
    items,
    total,
    facets: {
      country: termBuckets(aggs.country, query.countries ?? []),
      category: termBuckets(aggs.category, query.categories ?? []),
      price: priceBuckets(aggs.price, query),
    },
  };
}
