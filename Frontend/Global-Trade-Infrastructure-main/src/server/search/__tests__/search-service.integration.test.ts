/**
 * @file server/search/__tests__/search-service.integration.test.ts
 * @description PROMPT 8 — integration tests for the search service against real
 * (embedded) PostgreSQL via the default parity backend. Seeds catalogue products
 * with Country/Price/Category in their attributes, then asserts full-text search,
 * the three facet dimensions, facet filtering, sorting, suggestions and RLS scope.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { searchService } from '../search-service';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'search-admin', actorRole: 'PLATFORM_ADMIN', source: 'test' };
}

async function seedCatalog(ctx: KbActorContext) {
  const make = (name: string, code: string, country: string, category: string, unitPrice: number) =>
    gckbService.create(ctx, 'product', {
      name,
      code,
      tags: [category],
      attributes: {
        originCountryCode: country,
        categoryKey: category,
        description: `${name} sourced from ${country}`,
        commercialTerms: { unitPrice, currency: 'USD' },
      },
    });
  await make('Basmati Rice 5kg', 'RICE-IN', 'IN', 'grains', 25);
  await make('Jasmine Rice 5kg', 'RICE-TH', 'TH', 'grains', 30);
  await make('Arabica Coffee 1kg', 'COF-BR', 'BR', 'beverages', 40);
  await make('Robusta Coffee 1kg', 'COF-VN', 'VN', 'beverages', 18);
}

describe('search service (PostgreSQL parity backend)', () => {
  let orgA: string;
  let orgB: string;

  beforeEach(async () => {
    await resetDatabase();
    orgA = await seedOrganization('Org A');
    orgB = await seedOrganization('Org B');
  });
  afterAll(async () => {
    await disconnect();
  });

  it('full-text searches the catalogue and reports the backend', async () => {
    await seedCatalog(ctxFor(orgA));
    const r = await searchService.search(orgA, { keyword: 'rice' });
    expect(r.backend).toBe('postgres');
    expect(r.total).toBe(2);
    expect(r.items.every((i) => i.title.toLowerCase().includes('rice'))).toBe(true);
    expect(r.items.every((i) => i.score > 0)).toBe(true);
  });

  it('returns Country, Category and Price facets', async () => {
    await seedCatalog(ctxFor(orgA));
    const r = await searchService.search(orgA, {});
    expect(r.total).toBe(4);
    expect(r.facets.country.map((b) => b.key).sort()).toEqual(['BR', 'IN', 'TH', 'VN']);
    expect(r.facets.category.find((b) => b.key === 'grains')?.count).toBe(2);
    expect(r.facets.price.find((b) => b.key === '10-50')?.count).toBe(4);
  });

  it('filters by category and excludes that dimension from its own facet', async () => {
    await seedCatalog(ctxFor(orgA));
    const r = await searchService.search(orgA, { categories: ['grains'] });
    expect(r.total).toBe(2);
    expect(r.items.every((i) => i.category === 'grains')).toBe(true);
    // category facet still shows beverages; country facet is constrained to grains
    expect(r.facets.category.find((b) => b.key === 'beverages')?.count).toBe(2);
    expect(r.facets.country.map((b) => b.key).sort()).toEqual(['IN', 'TH']);
  });

  it('filters by country and by price range', async () => {
    await seedCatalog(ctxFor(orgA));
    expect((await searchService.search(orgA, { countries: ['IN'] })).total).toBe(1);
    expect((await searchService.search(orgA, { minPrice: 20 })).total).toBe(3); // excludes the 18 coffee
  });

  it('sorts by price', async () => {
    await seedCatalog(ctxFor(orgA));
    const asc = await searchService.search(orgA, { sort: 'price_asc' });
    expect(asc.items[0].price).toBe(18);
    const desc = await searchService.search(orgA, { sort: 'price_desc' });
    expect(desc.items[0].price).toBe(40);
  });

  it('offers type-ahead suggestions by prefix', async () => {
    await seedCatalog(ctxFor(orgA));
    const s = await searchService.suggest(orgA, 'Bas');
    expect(s.some((x) => x.title.startsWith('Basmati'))).toBe(true);
  });

  it('reindex is a no-op for the parity backend', async () => {
    await seedCatalog(ctxFor(orgA));
    const res = await searchService.reindex(orgA);
    expect(res.backend).toBe('postgres');
    expect(res.indexed).toBe(0);
  });

  it('RLS: another tenant cannot see Org A private catalogue', async () => {
    await seedCatalog(ctxFor(orgA));
    expect((await searchService.search(orgB, { keyword: 'rice' })).total).toBe(0);
  });
});
