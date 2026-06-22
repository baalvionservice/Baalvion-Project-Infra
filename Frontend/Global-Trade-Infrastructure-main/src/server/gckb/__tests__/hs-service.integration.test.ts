/**
 * @file server/gckb/__tests__/hs-service.integration.test.ts
 * @description MODULE 2 integration tests against real PostgreSQL. Proves the
 * Global HS Registry inherits the GCKB lifecycle: build a hierarchy
 * (chapter → heading → subheading → national line) with typed edges, search by
 * the promoted hsCode facet, effective-dated editions, transactional import,
 * archive, and RLS tenant isolation — with no HS-specific persistence code.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { withTenant } from '../../db/prisma';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { HS_RELATIONSHIP_TYPES } from '../registries/hs-code';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'hs-admin', actorRole: 'PLATFORM_ADMIN', ip: '10.0.0.7', source: 'test' };
}

describe('HS registry (PostgreSQL)', () => {
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

  it('builds an HS hierarchy with typed parent/extension edges', async () => {
    const ctx = ctxFor(orgA);
    const chapter = await gckbService.create(ctx, 'hs_code', { name: 'Cereals', hsCode: '10', attributes: { level: 2, chapter: '10' } });
    const heading = await gckbService.create(ctx, 'hs_code', { name: 'Rice', hsCode: '1006', attributes: { level: 4, parentHsCode: '10' } });
    const subheading = await gckbService.create(ctx, 'hs_code', { name: 'Milled rice', hsCode: '100630', attributes: { level: 6, parentHsCode: '1006' } });
    const national = await gckbService.create(ctx, 'hs_code', { name: 'Basmati', hsCode: '10063010', attributes: { level: 8, parentHsCode: '100630', countryCode: 'IN' } });

    expect(chapter.recordKey).toBe('10');
    expect(subheading.recordKey).toBe('100630');
    expect(national.recordKey).toBe('IN:10063010');

    await gckbService.addRelationship(ctx, heading.id, { relationType: HS_RELATIONSHIP_TYPES.SUBHEADING_OF, toType: 'hs_code', toId: chapter.id });
    await gckbService.addRelationship(ctx, subheading.id, { relationType: HS_RELATIONSHIP_TYPES.SUBHEADING_OF, toType: 'hs_code', toId: heading.id });
    await gckbService.addRelationship(ctx, national.id, { relationType: HS_RELATIONSHIP_TYPES.NATIONAL_EXTENSION_OF, toType: 'hs_code', toId: subheading.id });

    expect(await gckbService.listRelationships(ctx, national.id)).toHaveLength(1);
  });

  it('searches by the promoted hsCode facet and versions on a description change', async () => {
    const ctx = ctxFor(orgA);
    const sub = await gckbService.create(ctx, 'hs_code', { name: 'Milled rice', hsCode: '100630', attributes: { level: 6, edition: 'HS2017' } });

    expect((await gckbService.search(ctx, { entityType: 'hs_code', hsCode: '100630' })).total).toBe(1);
    expect((await gckbService.search(ctx, { entityType: 'hs_code', keyword: 'rice' })).total).toBeGreaterThanOrEqual(1);

    const v2 = await gckbService.update(ctx, sub.id, { name: 'Rice, semi-milled or wholly milled', attributes: { level: 6, edition: 'HS2022' }, reason: 'HS2022 edition' });
    expect(v2.version).toBe(2);
  });

  it('imports an HS batch transactionally and is idempotent', async () => {
    const ctx = ctxFor(orgA);
    const rows = [
      { name: 'Cereals', hsCode: '10', attributes: { level: 2 } },
      { name: 'Rice', hsCode: '1006', attributes: { level: 4, parentHsCode: '10' } },
    ];
    const first = await gckbService.applyImport(ctx, 'hs_code', rows);
    expect(first.created).toBe(2);
    const second = await gckbService.applyImport(ctx, 'hs_code', rows);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0);

    // Invalid level rolls back the whole batch.
    const bad = [
      { name: 'Wheat', hsCode: '1001', attributes: { level: 4 } },
      { name: 'Bad', hsCode: '1002', attributes: { level: 5 } },
    ];
    await expect(gckbService.applyImport(ctx, 'hs_code', bad)).rejects.toThrow();
    expect((await gckbService.search(ctx, { entityType: 'hs_code', hsCode: '1001' })).total).toBe(0);
  });

  it('RLS: HS codes are tenant-isolated with a shared global baseline', async () => {
    await gckbService.create(ctxFor(null), 'hs_code', { name: 'Cereals', hsCode: '10', attributes: { level: 2 } }); // global
    await gckbService.create(ctxFor(orgA), 'hs_code', { name: 'Rice', hsCode: '1006', attributes: { level: 4 } }); // Org A

    const aKeys = (await withTenant(orgA, (tx) => tx.gckbRecord.findMany({ where: { entityType: 'hs_code' } }))).map((r) => r.recordKey);
    expect(aKeys).toContain('10');
    expect(aKeys).toContain('1006');

    const bKeys = (await withTenant(orgB, (tx) => tx.gckbRecord.findMany({ where: { entityType: 'hs_code' } }))).map((r) => r.recordKey);
    expect(bKeys).toContain('10');
    expect(bKeys).not.toContain('1006');
  });
});
