/**
 * @file server/gckb/__tests__/product-service.integration.test.ts
 * @description MODULE 1 integration tests against real PostgreSQL. The Universal
 * Product Registry rides the generic GCKB engine, so this proves the inherited
 * lifecycle works end-to-end for products: create/version/history, faceted
 * search (hsCode / productCategory / code / tag / keyword), typed relationships
 * to manufacturer/brand/category, transactional import (idempotent + rollback),
 * archive, domain events and RLS tenant isolation — with no product-specific
 * persistence code.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { prisma, withTenant } from '../../db/prisma';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { PRODUCT_RELATIONSHIP_TYPES } from '../registries/product';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'product-admin', actorRole: 'PLATFORM_ADMIN', ip: '10.0.0.9', source: 'test' };
}

const RICE = {
  name: 'Basmati Rice 5kg',
  code: 'RICE-BAS-5',
  hsCode: '100630',
  productCategory: 'FOOD/GRAINS',
  tags: ['food', 'grain'],
  attributes: {
    gtin: '8901234567890',
    brand: 'GoldenField',
    originCountryCode: 'IN',
    specifications: { grade: 'A', moisturePercent: 12 },
    weight: { net: 5, gross: 5.2, unit: 'kg' },
    shelfLife: { value: 24, unit: 'MONTH' },
    tradeMetadata: { unitOfMeasure: 'KG', incoterms: ['FOB'], dutiable: true, currency: 'USD' },
  },
};

describe('product registry (PostgreSQL)', () => {
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

  it('creates a product with promoted facets and versions on change', async () => {
    const ctx = ctxFor(orgA);
    const created = await gckbService.create(ctx, 'product', { ...RICE });
    expect(created.recordKey).toBe('8901234567890'); // GTIN is the canonical global key (precedence GPID > GTIN > SKU > code)
    expect(created.code).toBe('RICE-BAS-5'); // internal code is still promoted/indexed
    expect(created.hsCode).toBe('100630');
    expect(created.productCategory).toBe('FOOD/GRAINS');
    expect(created.version).toBe(1);

    const v2 = await gckbService.update(ctx, created.id, {
      attributes: { ...RICE.attributes, specifications: { grade: 'A+', moisturePercent: 11 } },
      reason: 'spec revision',
    });
    expect(v2.version).toBe(2);

    const noop = await gckbService.update(ctx, created.id, {
      attributes: { ...RICE.attributes, specifications: { grade: 'A+', moisturePercent: 11 } },
    });
    expect(noop.version).toBe(2); // identical content → no new version

    const history = await gckbService.history(ctx, created.id);
    expect(history.map((h) => h.version)).toEqual([2, 1]);
  });

  it('searches products by hsCode, productCategory, code, tag and keyword', async () => {
    const ctx = ctxFor(orgA);
    await gckbService.create(ctx, 'product', { ...RICE });

    expect((await gckbService.search(ctx, { entityType: 'product', hsCode: '100630' })).total).toBe(1);
    expect((await gckbService.search(ctx, { entityType: 'product', productCategory: 'FOOD/GRAINS' })).total).toBe(1);
    expect((await gckbService.search(ctx, { entityType: 'product', code: 'RICE-BAS-5' })).total).toBe(1);
    expect((await gckbService.search(ctx, { entityType: 'product', tag: 'grain' })).total).toBe(1);
    expect((await gckbService.search(ctx, { entityType: 'product', keyword: 'Basmati' })).total).toBeGreaterThanOrEqual(1);
    expect((await gckbService.search(ctx, { entityType: 'product', hsCode: '999999' })).total).toBe(0);
  });

  it('links a product to its manufacturer, brand and category via typed edges', async () => {
    const ctx = ctxFor(orgA);
    const maker = await gckbService.create(ctx, 'manufacturer', { name: 'Acme Foods', code: 'ACME', attributes: { countryCode: 'IN' } });
    const brand = await gckbService.create(ctx, 'brand', { name: 'GoldenField', code: 'GF', attributes: {} });
    const category = await gckbService.create(ctx, 'product_category', { name: 'Grains', code: 'GRAINS', attributes: { level: 1 } });
    const product = await gckbService.create(ctx, 'product', { ...RICE });

    await gckbService.addRelationship(ctx, product.id, { relationType: PRODUCT_RELATIONSHIP_TYPES.MANUFACTURED_BY, toType: 'manufacturer', toId: maker.id });
    await gckbService.addRelationship(ctx, product.id, { relationType: PRODUCT_RELATIONSHIP_TYPES.BRANDED_AS, toType: 'brand', toId: brand.id });
    await gckbService.addRelationship(ctx, product.id, { relationType: PRODUCT_RELATIONSHIP_TYPES.CLASSIFIED_AS, toType: 'product_category', toId: category.id });
    await gckbService.addRelationship(ctx, product.id, { relationType: PRODUCT_RELATIONSHIP_TYPES.CLASSIFIED_UNDER_HS, toType: 'hs_code', toRef: '1006.30' });

    const rels = await gckbService.listRelationships(ctx, product.id);
    expect(rels).toHaveLength(4);
    expect(rels.map((r) => r.relationType)).toContain(PRODUCT_RELATIONSHIP_TYPES.MANUFACTURED_BY);
  });

  it('archives a product and hides it from search while keeping history', async () => {
    const ctx = ctxFor(orgA);
    const product = await gckbService.create(ctx, 'product', { ...RICE });
    await gckbService.archive(ctx, product.id, 'discontinued');

    expect((await gckbService.search(ctx, { entityType: 'product' })).total).toBe(0);
    // History is retained in the immutable, append-only revision store even
    // though the archived head row is hidden from the scoped read path.
    const revisions = await prisma.gckbRevision.findMany({ where: { recordId: product.id } });
    expect(revisions.some((r) => r.action === 'ARCHIVE')).toBe(true);
    expect(revisions.some((r) => r.action === 'CREATE')).toBe(true);
  });

  it('imports a product batch transactionally, idempotently, and rolls back on a bad row', async () => {
    const ctx = ctxFor(orgA);
    const rows = [
      { name: 'Widget A', code: 'W-A', attributes: { weight: { net: 1, unit: 'kg' } } },
      { name: 'Widget B', code: 'W-B', attributes: { weight: { net: 2, unit: 'kg' } } },
    ];

    const first = await gckbService.applyImport(ctx, 'product', rows);
    expect(first.created).toBe(2);

    const second = await gckbService.applyImport(ctx, 'product', rows);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0); // unchanged checksums skip

    // One invalid row (weight without a unit) rolls the whole batch back.
    const bad = [
      { name: 'Widget C', code: 'W-C', attributes: { weight: { net: 3, unit: 'kg' } } },
      { name: 'Widget D', code: 'W-D', attributes: { weight: { net: 4 } } },
    ];
    await expect(gckbService.applyImport(ctx, 'product', bad)).rejects.toThrow();
    expect((await gckbService.search(ctx, { entityType: 'product', code: 'W-C' })).total).toBe(0);
  });

  it('emits PRODUCT_CREATED domain events', async () => {
    await gckbService.create(ctxFor(orgA), 'product', { ...RICE });
    expect((await prisma.domainEvent.findMany({ where: { type: 'PRODUCT_CREATED' } })).length).toBeGreaterThanOrEqual(1);
  });

  it('RLS: a tenant sees the global product baseline + its own products, never another tenant\'s', async () => {
    await gckbService.create(ctxFor(null), 'product', { name: 'Global Pallet', code: 'GLOBAL-PALLET', attributes: {} }); // global baseline
    await gckbService.create(ctxFor(orgA), 'product', { ...RICE }); // Org A only

    const aKeys = (await withTenant(orgA, (tx) => tx.gckbRecord.findMany({ where: { entityType: 'product' } }))).map((r) => r.recordKey);
    expect(aKeys).toContain('GLOBAL-PALLET');
    expect(aKeys).toContain('8901234567890'); // Org A's RICE product (GTIN key)

    const bKeys = (await withTenant(orgB, (tx) => tx.gckbRecord.findMany({ where: { entityType: 'product' } }))).map((r) => r.recordKey);
    expect(bKeys).toContain('GLOBAL-PALLET');
    expect(bKeys).not.toContain('8901234567890');
  });
});
