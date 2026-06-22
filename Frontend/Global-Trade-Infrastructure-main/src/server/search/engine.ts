/**
 * @file server/search/engine.ts
 * @description PROMPT 8 — the pure search engine. Given a candidate set of
 * `SearchDocument`s and a `SearchQuery`, it produces ranked hits plus Country /
 * Category / Price facets. Faceting follows the standard rule that a facet's own
 * selection is EXCLUDED from its counts (so a user can still see and switch other
 * values in that dimension) while every other active filter is applied. Pure and
 * deterministic — no I/O, no clock — so it is exhaustively unit-testable, and the
 * Postgres parity backend reuses it verbatim.
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

export function priceBucketKey(price: number | null): string | null {
  if (price === null) return null;
  for (const b of PRICE_BUCKETS) {
    if (price >= b.from && (b.to === null || price < b.to)) return b.key;
  }
  return null;
}

/** Relevance score for a keyword against a document (0 when no keyword). */
export function scoreDocument(doc: SearchDocument, kwLower: string): number {
  if (!kwLower) return 0;
  const title = doc.title.toLowerCase();
  let s = 0;
  if (title === kwLower) s += 100;
  else if (title.startsWith(kwLower)) s += 60;
  else if (title.includes(kwLower)) s += 40;
  if (doc.recordKey.toLowerCase().includes(kwLower)) s += 20;
  if ((doc.brand ?? '').toLowerCase().includes(kwLower)) s += 15;
  if ((doc.category ?? '').toLowerCase().includes(kwLower)) s += 12;
  if ((doc.hsCode ?? '').toLowerCase().includes(kwLower)) s += 10;
  if (doc.tags.some((t) => t.toLowerCase() === kwLower)) s += 15;
  // Final safety net: any haystack hit guarantees a positive score.
  if (s === 0 && doc.searchText.includes(kwLower)) s += 5;
  return s;
}

function matchesKeyword(doc: SearchDocument, kwLower: string): boolean {
  return !kwLower || doc.searchText.includes(kwLower);
}

function passesCountry(doc: SearchDocument, countries?: string[]): boolean {
  if (!countries || countries.length === 0) return true;
  return doc.country !== null && countries.includes(doc.country);
}

function passesCategory(doc: SearchDocument, categories?: string[]): boolean {
  if (!categories || categories.length === 0) return true;
  return doc.category !== null && categories.includes(doc.category);
}

function passesPrice(doc: SearchDocument, min?: number, max?: number): boolean {
  if (min === undefined && max === undefined) return true;
  if (doc.price === null) return false;
  if (min !== undefined && doc.price < min) return false;
  if (max !== undefined && doc.price > max) return false;
  return true;
}

function toHit(doc: SearchDocument, score: number): SearchHit {
  return {
    id: doc.id,
    entityType: doc.entityType,
    domain: doc.domain,
    recordKey: doc.recordKey,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    country: doc.country,
    price: doc.price,
    currency: doc.currency,
    brand: doc.brand,
    hsCode: doc.hsCode,
    tags: doc.tags,
    status: doc.status,
    imageUrl: doc.imageUrl,
    updatedAt: doc.updatedAt,
    score,
  };
}

function countBy(docs: SearchDocument[], pick: (d: SearchDocument) => string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const d of docs) {
    const key = pick(d);
    if (key === null) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function termFacet(counts: Map<string, number>, selected: string[]): FacetBucket[] {
  const sel = new Set(selected);
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: key, count, selected: sel.has(key) }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function priceFacet(docs: SearchDocument[], min?: number, max?: number): PriceFacetBucket[] {
  const counts = countBy(docs, (d) => priceBucketKey(d.price));
  const isSelected = (from: number, to: number | null): boolean =>
    (min !== undefined || max !== undefined) &&
    (min ?? from) === from &&
    (max ?? (to ?? Infinity)) === (to ?? Infinity);
  return PRICE_BUCKETS.map((b) => ({
    key: b.key,
    label: b.label,
    from: b.from,
    to: b.to,
    count: counts.get(b.key) ?? 0,
    selected: isSelected(b.from, b.to),
  }));
}

function rank(docs: SearchDocument[], kwLower: string, sort: SearchQuery['sort']): Array<{ doc: SearchDocument; score: number }> {
  const scored = docs.map((doc) => ({ doc, score: scoreDocument(doc, kwLower) }));
  const byNewest = (a: { doc: SearchDocument }, b: { doc: SearchDocument }): number =>
    b.doc.updatedAt.localeCompare(a.doc.updatedAt);
  switch (sort) {
    case 'price_asc':
      return scored.sort((a, b) => (a.doc.price ?? Infinity) - (b.doc.price ?? Infinity) || byNewest(a, b));
    case 'price_desc':
      return scored.sort((a, b) => (b.doc.price ?? -Infinity) - (a.doc.price ?? -Infinity) || byNewest(a, b));
    case 'newest':
      return scored.sort(byNewest);
    default: // relevance — score first, recency as the tie-breaker
      return scored.sort((a, b) => b.score - a.score || byNewest(a, b));
  }
}

export interface EngineResultCore {
  items: SearchHit[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
}

/** Run the full faceted search over an in-memory candidate set. */
export function searchDocuments(docs: SearchDocument[], query: SearchQuery): EngineResultCore {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));
  const kwLower = (query.keyword ?? '').trim().toLowerCase();

  // Keyword is the query, not a facet, so it constrains every count.
  const matched = docs.filter((d) => matchesKeyword(d, kwLower));

  // The result set applies all filters; each facet set excludes its own dimension.
  const fully = matched.filter(
    (d) =>
      passesCountry(d, query.countries) &&
      passesCategory(d, query.categories) &&
      passesPrice(d, query.minPrice, query.maxPrice),
  );
  const forCountry = matched.filter(
    (d) => passesCategory(d, query.categories) && passesPrice(d, query.minPrice, query.maxPrice),
  );
  const forCategory = matched.filter(
    (d) => passesCountry(d, query.countries) && passesPrice(d, query.minPrice, query.maxPrice),
  );
  const forPrice = matched.filter(
    (d) => passesCountry(d, query.countries) && passesCategory(d, query.categories),
  );

  const ranked = rank(fully, kwLower, query.sort);
  const start = (page - 1) * pageSize;
  const items = ranked.slice(start, start + pageSize).map(({ doc, score }) => toHit(doc, score));

  const facets: SearchFacets = {
    country: termFacet(countBy(forCountry, (d) => d.country), query.countries ?? []),
    category: termFacet(countBy(forCategory, (d) => d.category), query.categories ?? []),
    price: priceFacet(forPrice, query.minPrice, query.maxPrice),
  };

  return { items, total: fully.length, page, pageSize, facets };
}

/** Prefix type-ahead over the candidate titles / keys (relevance-ish ordering). */
export function suggestDocuments(
  docs: SearchDocument[],
  prefix: string,
  limit: number,
): Array<{ id: string; entityType: string; title: string; recordKey: string }> {
  const p = prefix.trim().toLowerCase();
  if (!p) return [];
  return docs
    .filter(
      (d) =>
        d.title.toLowerCase().startsWith(p) ||
        d.recordKey.toLowerCase().startsWith(p) ||
        d.title.toLowerCase().includes(p),
    )
    .sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(p) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(p) ? 0 : 1;
      return aStarts - bStarts || a.title.localeCompare(b.title);
    })
    .slice(0, Math.min(25, Math.max(1, limit)))
    .map((d) => ({ id: d.id, entityType: d.entityType, title: d.title, recordKey: d.recordKey }));
}
