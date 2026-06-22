/**
 * @file server/search/types.ts
 * @description PROMPT 8 — Marketplace Search Engine: the backend-neutral contract.
 *
 * A `SearchDocument` is the flat, denormalised projection of a catalogue record
 * (a GCKB `product` / `product_variant`, …) carrying exactly the fields the search
 * surface needs: full-text fields plus the three promoted facet axes the product
 * asked for — **Country**, **Price**, **Category**. A `SearchBackend` is the port
 * that turns a `SearchQuery` into a `SearchResult`; two implementations satisfy it
 * (OpenSearch in production, an in-process Postgres/GCKB parity backend for dev,
 * CI and the embedded-Postgres test run) so the engine is verifiable with zero new
 * infrastructure while production runs on a real cluster.
 */

/** The flat search document — one per sellable/searchable catalogue record. */
export interface SearchDocument {
  id: string;
  organizationId: string | null; // null = platform-global baseline (visible to all tenants)
  entityType: string; // product | product_variant | …
  domain: string | null; // registry domain (product, …)
  recordKey: string;
  title: string;
  description: string | null;
  /** Promoted facet — product category (taxonomy node / promoted column). */
  category: string | null;
  /** Promoted facet — ISO-3166-1 alpha-2 country of origin (uppercased). */
  country: string | null;
  /** Promoted facet — indicative unit price (currency-tagged below). */
  price: number | null;
  currency: string | null;
  brand: string | null;
  hsCode: string | null;
  tags: string[];
  status: string;
  imageUrl: string | null;
  updatedAt: string; // ISO-8601
  /** Lower-cased haystack used for keyword matching by the parity backend. */
  searchText: string;
}

export type SearchSort = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

/** A parsed, validated query at the engine boundary (tenant comes separately). */
export interface SearchQuery {
  keyword?: string;
  /** Facet filters — values inside one dimension are OR-ed; dimensions are AND-ed. */
  countries?: string[];
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  /** Optional scoping that is not surfaced as a facet. */
  entityTypes?: string[];
  status?: string;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
}

export interface FacetBucket {
  key: string;
  label: string;
  count: number;
  selected: boolean;
}

export interface PriceFacetBucket extends FacetBucket {
  from: number | null;
  to: number | null;
}

export interface SearchFacets {
  country: FacetBucket[];
  category: FacetBucket[];
  price: PriceFacetBucket[];
}

export interface SearchHit {
  id: string;
  entityType: string;
  domain: string | null;
  recordKey: string;
  title: string;
  description: string | null;
  category: string | null;
  country: string | null;
  price: number | null;
  currency: string | null;
  brand: string | null;
  hsCode: string | null;
  tags: string[];
  status: string;
  imageUrl: string | null;
  updatedAt: string;
  score: number;
}

export type SearchBackendName = 'opensearch' | 'postgres';

export interface SearchResult {
  items: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
  backend: SearchBackendName;
  /** True when the match set exceeded the candidate window (parity backend only). */
  capped: boolean;
}

export interface SearchSuggestion {
  id: string;
  entityType: string;
  title: string;
  recordKey: string;
}

/**
 * The search port. `search`/`suggest` are read paths; `index`/`remove` keep an
 * external index in sync (no-ops for the live-reading Postgres parity backend).
 */
export interface SearchBackend {
  readonly name: SearchBackendName;
  search(organizationId: string | null, query: SearchQuery): Promise<SearchResult>;
  suggest(organizationId: string | null, prefix: string, limit: number): Promise<SearchSuggestion[]>;
  index(docs: SearchDocument[]): Promise<number>;
  remove(ids: string[]): Promise<number>;
}

/** Preset price-range buckets (currency-agnostic; see SEARCH-ENGINE.md caveat). */
export const PRICE_BUCKETS: ReadonlyArray<{ key: string; label: string; from: number; to: number | null }> = [
  { key: '0-10', label: 'Under 10', from: 0, to: 10 },
  { key: '10-50', label: '10 – 50', from: 10, to: 50 },
  { key: '50-100', label: '50 – 100', from: 50, to: 100 },
  { key: '100-500', label: '100 – 500', from: 100, to: 500 },
  { key: '500-1000', label: '500 – 1,000', from: 500, to: 1000 },
  { key: '1000+', label: '1,000 +', from: 1000, to: null },
];

/** Entity types that make up the searchable marketplace catalogue by default. */
export const CATALOG_ENTITY_TYPES = ['product', 'product_variant'] as const;

/** Hard cap on the candidate window the parity backend ranks/facets in memory. */
export const CANDIDATE_CAP = 1000;

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;
