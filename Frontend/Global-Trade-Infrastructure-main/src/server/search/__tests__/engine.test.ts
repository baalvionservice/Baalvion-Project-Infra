/**
 * @file server/search/__tests__/engine.test.ts
 * @description PROMPT 8 — unit tests for the pure faceted search engine: keyword
 * matching + ranking, pagination, the three facet dimensions, and (critically) the
 * "a facet excludes its own selection from its counts" rule.
 */
import { describe, it, expect } from 'vitest';
import { searchDocuments, suggestDocuments, priceBucketKey } from '../engine';
import { SearchDocument } from '../types';

let seq = 0;
function doc(partial: Partial<SearchDocument>): SearchDocument {
  seq += 1;
  const base: SearchDocument = {
    id: `d${seq}`,
    organizationId: 'org',
    entityType: 'product',
    domain: 'product',
    recordKey: `K${seq}`,
    title: 'Item',
    description: null,
    category: null,
    country: null,
    price: null,
    currency: 'USD',
    brand: null,
    hsCode: null,
    tags: [],
    status: 'PUBLISHED',
    imageUrl: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    searchText: '',
    ...partial,
  };
  // keep the haystack consistent with the chosen fields unless caller set it
  if (!partial.searchText) {
    base.searchText = [base.title, base.brand, base.category, base.country, ...base.tags]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
  return base;
}

const corpus = (): SearchDocument[] => [
  doc({ title: 'Basmati Rice 5kg', category: 'grains', country: 'IN', price: 25 }),
  doc({ title: 'Jasmine Rice 5kg', category: 'grains', country: 'TH', price: 30 }),
  doc({ title: 'Arabica Coffee 1kg', category: 'beverages', country: 'BR', price: 40 }),
  doc({ title: 'Robusta Coffee 1kg', category: 'beverages', country: 'VN', price: 18 }),
];

describe('priceBucketKey', () => {
  it('maps prices to preset buckets', () => {
    expect(priceBucketKey(5)).toBe('0-10');
    expect(priceBucketKey(10)).toBe('10-50');
    expect(priceBucketKey(999)).toBe('500-1000');
    expect(priceBucketKey(1000)).toBe('1000+');
    expect(priceBucketKey(null)).toBeNull();
  });
});

describe('searchDocuments — keyword + ranking', () => {
  it('filters by keyword across the haystack', () => {
    const r = searchDocuments(corpus(), { keyword: 'rice' });
    expect(r.total).toBe(2);
    expect(r.items.every((i) => i.title.toLowerCase().includes('rice'))).toBe(true);
  });

  it('ranks exact/prefix title matches above mid-string matches', () => {
    const docs = [doc({ title: 'Green Tea' }), doc({ title: 'Tea' }), doc({ title: 'Herbal tea blend' })];
    const r = searchDocuments(docs, { keyword: 'tea' });
    expect(r.items[0].title).toBe('Tea'); // exact wins
    expect(r.items.every((i) => i.score > 0)).toBe(true);
  });

  it('returns everything when no keyword is given', () => {
    expect(searchDocuments(corpus(), {}).total).toBe(4);
  });

  it('paginates', () => {
    const r = searchDocuments(corpus(), { pageSize: 2, page: 2 });
    expect(r.items).toHaveLength(2);
    expect(r.page).toBe(2);
  });

  it('sorts by price ascending and descending', () => {
    expect(searchDocuments(corpus(), { sort: 'price_asc' }).items[0].price).toBe(18);
    expect(searchDocuments(corpus(), { sort: 'price_desc' }).items[0].price).toBe(40);
  });
});

describe('searchDocuments — facets', () => {
  it('produces country, category and price facets', () => {
    const r = searchDocuments(corpus(), {});
    expect(r.facets.country.map((b) => b.key).sort()).toEqual(['BR', 'IN', 'TH', 'VN']);
    expect(r.facets.category.find((b) => b.key === 'grains')?.count).toBe(2);
    expect(r.facets.price.find((b) => b.key === '10-50')?.count).toBe(4);
  });

  it('applies a facet filter to the result set', () => {
    const r = searchDocuments(corpus(), { categories: ['beverages'] });
    expect(r.total).toBe(2);
    expect(r.items.every((i) => i.category === 'beverages')).toBe(true);
  });

  it('excludes a facet’s own selection from its counts but applies it to others', () => {
    const r = searchDocuments(corpus(), { categories: ['grains'] });
    // category facet ignores the category filter -> still sees beverages
    expect(r.facets.category.find((b) => b.key === 'beverages')?.count).toBe(2);
    expect(r.facets.category.find((b) => b.key === 'grains')?.selected).toBe(true);
    // country facet DOES apply the category filter -> only grain countries
    expect(r.facets.country.map((b) => b.key).sort()).toEqual(['IN', 'TH']);
  });

  it('filters by price range and reflects it in other facets', () => {
    const r = searchDocuments(corpus(), { minPrice: 20 });
    expect(r.total).toBe(3); // excludes the 18 coffee
    expect(r.facets.country.map((b) => b.key).sort()).toEqual(['BR', 'IN', 'TH']);
  });

  it('combines country + price filters', () => {
    const r = searchDocuments(corpus(), { countries: ['IN', 'TH'], minPrice: 28 });
    expect(r.total).toBe(1);
    expect(r.items[0].country).toBe('TH');
  });
});

describe('suggestDocuments', () => {
  it('prefers prefix matches, then substring', () => {
    const out = suggestDocuments(corpus(), 'ar', 5);
    expect(out[0].title.toLowerCase().startsWith('ar')).toBe(true);
  });
  it('returns nothing for blank prefix', () => {
    expect(suggestDocuments(corpus(), '  ', 5)).toEqual([]);
  });
});
