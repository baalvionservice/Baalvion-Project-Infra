import { searchClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchOptions {
  query: string;
  index: string;
  filters?: Record<string, string | number | boolean>;
  from?: number;
  size?: number;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  highlight?: string[];
  fuzzy?: boolean;
}

export interface SearchHit<T> {
  id: string;
  score: number;
  source: T;
  highlight?: Record<string, string[]>;
}

export interface SearchResult<T> {
  hits: Array<SearchHit<T>>;
  total: number;
  took: number;
}

export interface FacetBucket {
  key: string;
  count: number;
}

export interface FacetedSearchResult<T> extends SearchResult<T> {
  facets: Record<string, FacetBucket[]>;
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Execute a full-text search with optional filters, sorting, and highlighting.
 * Supports fuzzy matching and term-level filters.
 */
export async function search<T = Record<string, unknown>>(
  opts: SearchOptions,
): Promise<SearchResult<T>> {
  const {
    query,
    index,
    filters = {},
    from = 0,
    size = 20,
    sort,
    highlight,
    fuzzy = false,
  } = opts;

  // Build multi_match query
  const multiMatch: object = fuzzy
    ? { multi_match: { query, fuzziness: 'AUTO', prefix_length: 2 } }
    : { multi_match: { query, type: 'best_fields' } };

  // Build filter clauses from filters map
  const filterClauses = Object.entries(filters).map(([field, value]) => ({
    term: { [field]: value },
  }));

  const boolQuery: Record<string, unknown> = {
    must: multiMatch,
  };
  if (filterClauses.length > 0) {
    boolQuery.filter = filterClauses;
  }

  // Build highlight config
  const highlightConfig = highlight && highlight.length > 0
    ? {
        fields: Object.fromEntries(highlight.map((f) => [f, {}])),
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      }
    : undefined;

  // Build sort config
  const sortConfig = sort?.map(({ field, order }) => ({ [field]: { order } }));

  const response = await searchClient.search({
    index,
    body: {
      from,
      size,
      query: { bool: boolQuery },
      ...(highlightConfig ? { highlight: highlightConfig } : {}),
      ...(sortConfig ? { sort: sortConfig } : {}),
    },
  });

  const body = response.body;
  const rawHits: Array<{
    _id: string;
    _score: number;
    _source: T;
    highlight?: Record<string, string[]>;
  }> = body.hits.hits;

  return {
    hits: rawHits.map((h) => ({
      id: h._id,
      score: h._score ?? 0,
      source: h._source,
      highlight: h.highlight,
    })),
    total: typeof body.hits.total === 'object'
      ? body.hits.total.value
      : body.hits.total ?? 0,
    took: body.took ?? 0,
  };
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────

/**
 * Prefix query suitable for autocomplete/typeahead.
 * Matches documents where `field` starts with `prefix`.
 */
export async function autocomplete<T = Record<string, unknown>>(
  index: string,
  field: string,
  prefix: string,
  size = 10,
): Promise<SearchResult<T>> {
  const response = await searchClient.search({
    index,
    body: {
      size,
      query: {
        prefix: { [field]: { value: prefix.toLowerCase() } },
      },
    },
  });

  const body = response.body;
  const rawHits: Array<{ _id: string; _score: number; _source: T }> = body.hits.hits;

  return {
    hits: rawHits.map((h) => ({
      id: h._id,
      score: h._score ?? 0,
      source: h._source,
    })),
    total: typeof body.hits.total === 'object'
      ? body.hits.total.value
      : body.hits.total ?? 0,
    took: body.took ?? 0,
  };
}

// ─── Faceted Search ───────────────────────────────────────────────────────────

/**
 * Faceted search: run a full-text query and simultaneously compute
 * term aggregations for each facet field.
 */
export async function facetedSearch<T = Record<string, unknown>>(
  index: string,
  query: string,
  facetFields: string[],
  opts: Pick<SearchOptions, 'filters' | 'from' | 'size'> = {},
): Promise<FacetedSearchResult<T>> {
  const { filters = {}, from = 0, size = 20 } = opts;

  const filterClauses = Object.entries(filters).map(([field, value]) => ({
    term: { [field]: value },
  }));

  const boolQuery: Record<string, unknown> = {
    must: { multi_match: { query, type: 'best_fields' } },
  };
  if (filterClauses.length > 0) {
    boolQuery.filter = filterClauses;
  }

  const aggs = Object.fromEntries(
    facetFields.map((field) => [
      field,
      { terms: { field, size: 50 } },
    ]),
  );

  const response = await searchClient.search({
    index,
    body: {
      from,
      size,
      query: { bool: boolQuery },
      aggs,
    },
  });

  const body = response.body;
  const rawHits: Array<{ _id: string; _score: number; _source: T }> = body.hits.hits;

  // Extract aggregation buckets
  const facets: Record<string, FacetBucket[]> = {};
  for (const field of facetFields) {
    const agg = body.aggregations?.[field];
    if (agg?.buckets) {
      facets[field] = (agg.buckets as Array<{ key: string; doc_count: number }>).map(
        (b) => ({ key: b.key, count: b.doc_count }),
      );
    } else {
      facets[field] = [];
    }
  }

  return {
    hits: rawHits.map((h) => ({
      id: h._id,
      score: h._score ?? 0,
      source: h._source,
    })),
    total: typeof body.hits.total === 'object'
      ? body.hits.total.value
      : body.hits.total ?? 0,
    took: body.took ?? 0,
    facets,
  };
}
