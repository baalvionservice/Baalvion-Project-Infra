/**
 * @file lib/search-client.ts
 * @description PROMPT 8 — browser client for the marketplace search engine. Calls
 * the same-origin GTI routes `GET /api/search` and `GET /api/search/suggest`;
 * identity + tenant are injected server-side by the auth-gateway (same model as the
 * goods-screening / sanctions clients), so the browser only sends the query. The
 * GTI `{ success, data, error }` envelope is unwrapped here.
 */

export type SearchSort = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

export interface SearchParams {
  q?: string;
  countries?: string[];
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
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

export interface SearchResult {
  items: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
  backend: string;
  capped: boolean;
}

export interface SearchSuggestion {
  id: string;
  entityType: string;
  title: string;
  recordKey: string;
}

/** Serialise the params into the `/api/search` query string (repeated facet keys). */
export function buildSearchQueryString(params: SearchParams): string {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set('q', params.q.trim());
  for (const c of params.countries ?? []) qs.append('country', c);
  for (const c of params.categories ?? []) qs.append('category', c);
  if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice));
  if (params.sort && params.sort !== 'relevance') qs.set('sort', params.sort);
  if (params.page && params.page > 1) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return qs.toString();
}

async function unwrap<T>(res: Response, fallbackMsg: string): Promise<T> {
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = payload?.error || `${fallbackMsg} (${res.status}).`;
    throw new Error(typeof msg === 'string' ? msg : `${fallbackMsg} (${res.status}).`);
  }
  return (payload?.data ?? payload) as T;
}

/** Run a faceted catalogue search. Throws a human-readable Error on failure. */
export async function searchCatalog(params: SearchParams, signal?: AbortSignal): Promise<SearchResult> {
  let res: Response;
  try {
    res = await fetch(`/api/search?${buildSearchQueryString(params)}`, {
      method: 'GET',
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new Error('Network error — could not reach the search service. Please retry.');
  }
  return unwrap<SearchResult>(res, 'Search service returned');
}

/** Type-ahead suggestions for the search box. Returns [] on any soft failure. */
export async function suggestCatalog(prefix: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
  const trimmed = prefix.trim();
  if (!trimmed) return [];
  try {
    const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}&limit=8`, {
      method: 'GET',
      credentials: 'include',
      signal,
    });
    if (!res.ok) return [];
    const payload = await res.json().catch(() => null);
    const data = (payload?.data ?? payload) as SearchSuggestion[] | null;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
