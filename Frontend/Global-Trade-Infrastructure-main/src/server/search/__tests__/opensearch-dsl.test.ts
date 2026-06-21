/**
 * @file server/search/__tests__/opensearch-dsl.test.ts
 * @description PROMPT 8 — unit tests for the pure OpenSearch DSL translation:
 * request-body shape (tenant scope, keyword, post_filter, per-facet agg filters
 * that exclude their own dimension) and response → result mapping. No live cluster.
 */
import { describe, it, expect } from 'vitest';
import { buildSearchBody, buildSuggestBody, parseSearchResponse, toIndexDoc, GLOBAL_TENANT } from '../opensearch-dsl';
import { SearchDocument } from '../types';

describe('buildSearchBody', () => {
  it('scopes to the tenant plus the global baseline', () => {
    const body = buildSearchBody('org-7', {}) as any;
    const tenants = body.query.bool.filter[0].terms.tenant;
    expect(tenants).toEqual(['org-7', GLOBAL_TENANT]);
  });

  it('uses match_all when there is no keyword and multi_match when there is', () => {
    expect((buildSearchBody(null, {}) as any).query.bool.must).toEqual({ match_all: {} });
    const kw = (buildSearchBody(null, { keyword: 'rice' }) as any).query.bool.must;
    expect(kw.multi_match.query).toBe('rice');
    expect(kw.multi_match.fields).toContain('title^3');
  });

  it('adds a post_filter for selected facets', () => {
    const body = buildSearchBody(null, { countries: ['IN'], minPrice: 10 }) as any;
    const clauses = body.post_filter.bool.filter;
    expect(clauses).toContainEqual({ terms: { 'country.keyword': ['IN'] } });
    expect(clauses).toContainEqual({ range: { price: { gte: 10 } } });
  });

  it('excludes a facet’s own selection from its aggregation filter', () => {
    const body = buildSearchBody(null, { countries: ['IN'], categories: ['grains'] }) as any;
    // country agg filter must NOT include the country selection, but must include category
    const countryFilter = JSON.stringify(body.aggs.country.filter);
    expect(countryFilter).toContain('category.keyword');
    expect(countryFilter).not.toContain('country.keyword');
    // price agg keeps both country and category
    const priceFilter = JSON.stringify(body.aggs.price.filter);
    expect(priceFilter).toContain('country.keyword');
    expect(priceFilter).toContain('category.keyword');
  });

  it('paginates with from/size', () => {
    const body = buildSearchBody(null, { page: 3, pageSize: 20 }) as any;
    expect(body.from).toBe(40);
    expect(body.size).toBe(20);
  });
});

describe('parseSearchResponse', () => {
  const resp = {
    hits: {
      total: { value: 2 },
      hits: [
        { _score: 9.1, _source: { id: 'a', entityType: 'product', title: 'Rice', country: 'IN', price: 25, category: 'grains' } },
        { _score: 4.0, _source: { id: 'b', entityType: 'product', title: 'Coffee', country: 'BR', price: 40, category: 'beverages' } },
      ],
    },
    aggregations: {
      country: { values: { buckets: [{ key: 'IN', doc_count: 1 }, { key: 'BR', doc_count: 1 }] } },
      category: { values: { buckets: [{ key: 'grains', doc_count: 1 }, { key: 'beverages', doc_count: 1 }] } },
      price: { ranges: { buckets: { '10-50': { doc_count: 1 }, '500-1000': { doc_count: 0 } } } },
    },
  };

  it('maps hits, total, scores and facets', () => {
    const parsed = parseSearchResponse(resp, { countries: ['IN'] });
    expect(parsed.total).toBe(2);
    expect(parsed.items[0]).toMatchObject({ id: 'a', title: 'Rice', score: 9.1 });
    expect(parsed.facets.country.find((b) => b.key === 'IN')?.selected).toBe(true);
    expect(parsed.facets.price.find((b) => b.key === '10-50')?.count).toBe(1);
  });

  it('is defensive against a missing/empty response', () => {
    const parsed = parseSearchResponse({}, {});
    expect(parsed.total).toBe(0);
    expect(parsed.items).toEqual([]);
    expect(parsed.facets.price).toHaveLength(6);
  });
});

describe('toIndexDoc', () => {
  it('adds the tenant keyword (global when org is null)', () => {
    const base = { id: 'x', organizationId: null } as unknown as SearchDocument;
    expect(toIndexDoc(base).tenant).toBe(GLOBAL_TENANT);
    expect(toIndexDoc({ ...base, organizationId: 'org-1' } as SearchDocument).tenant).toBe('org-1');
  });
});

describe('buildSuggestBody', () => {
  it('builds a prefix query bounded by limit', () => {
    const body = buildSuggestBody('bas', 5) as any;
    expect(body.size).toBe(5);
    expect(body.query.bool.should[0].match_phrase_prefix.title.query).toBe('bas');
  });
});
