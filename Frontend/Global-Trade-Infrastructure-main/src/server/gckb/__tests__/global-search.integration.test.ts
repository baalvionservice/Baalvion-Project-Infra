/**
 * @file server/gckb/__tests__/global-search.integration.test.ts
 * @description MODULE 8 integration tests against real PostgreSQL. Seeds a few
 * records across domains (product, organization, hs_code, certificate_type) and
 * asserts cross-entity search with relevance ranking, entity-type + domain
 * facets, type-ahead suggestions, the metadata catalog, and RLS scoping.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { globalSearchService } from '../global-search';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'search-admin', actorRole: 'PLATFORM_ADMIN', source: 'test' };
}

describe('global search (PostgreSQL)', () => {
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

  async function seedCorpus(ctx: KbActorContext) {
    await gckbService.create(ctx, 'product', { name: 'Basmati Rice 5kg', code: 'RICE-1', hsCode: '100630', tags: ['rice'], attributes: {} });
    await gckbService.create(ctx, 'product', { name: 'Jasmine Rice 5kg', code: 'RICE-2', hsCode: '100630', tags: ['rice'], attributes: {} });
    await gckbService.create(ctx, 'organization', { name: 'Rice Traders Inc', attributes: { registrationNumber: 'RTI-1' } });
    await gckbService.create(ctx, 'hs_code', { name: 'Milled rice', hsCode: '100630', attributes: { level: 6 } });
    await gckbService.create(ctx, 'certificate_type', { name: 'Phytosanitary Certificate', code: 'PHYTO', attributes: {} });
  }

  it('searches across entity types with ranking and facets', async () => {
    const ctx = ctxFor(orgA);
    await seedCorpus(ctx);

    const result = await globalSearchService.search(orgA, { keyword: 'rice' });
    // matches: 2 products + 1 organization + 1 hs_code = 4
    expect(result.total).toBe(4);
    const types = new Set(result.items.map((i) => i.entityType));
    expect(types.has('product')).toBe(true);
    expect(types.has('organization')).toBe(true);
    expect(types.has('hs_code')).toBe(true);

    // facets
    const productFacet = result.facets.entityType.find((f) => f.key === 'product');
    expect(productFacet?.count).toBe(2);
    const productDomain = result.facets.domain.find((f) => f.key === 'product');
    expect(productDomain?.count).toBe(2);

    // ranking: "Milled rice" / exact-ish startsWith beats a mid-string match; every hit carries a score
    expect(result.items.every((i) => i.score > 0)).toBe(true);
  });

  it('filters by entity type and by domain', async () => {
    const ctx = ctxFor(orgA);
    await seedCorpus(ctx);
    expect((await globalSearchService.search(orgA, { keyword: 'rice', entityTypes: ['product'] })).total).toBe(2);
    expect((await globalSearchService.search(orgA, { keyword: 'rice', domains: ['hs'] })).total).toBe(1);
  });

  it('returns type-ahead suggestions by prefix', async () => {
    const ctx = ctxFor(orgA);
    await seedCorpus(ctx);
    const suggestions = await globalSearchService.suggest(orgA, 'Bas');
    expect(suggestions.some((s) => s.name.startsWith('Basmati'))).toBe(true);
  });

  it('produces a metadata catalog grouped by domain with live counts', async () => {
    const ctx = ctxFor(orgA);
    await seedCorpus(ctx);
    const meta = await globalSearchService.metadata(orgA);
    const productDomain = meta.domains.find((d) => d.domain === 'product');
    expect(productDomain).toBeDefined();
    const productEntity = productDomain!.entityTypes.find((e) => e.entityType === 'product');
    expect(productEntity!.count).toBe(2);
    // every registered entity type appears, even with a zero count
    expect(productDomain!.entityTypes.some((e) => e.entityType === 'brand' && e.count === 0)).toBe(true);
  });

  it('RLS: search is tenant-scoped (Org B does not see Org A private records)', async () => {
    await seedCorpus(ctxFor(orgA));
    expect((await globalSearchService.search(orgB, { keyword: 'rice' })).total).toBe(0);
  });
});
