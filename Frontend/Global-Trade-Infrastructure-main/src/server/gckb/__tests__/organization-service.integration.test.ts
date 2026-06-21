/**
 * @file server/gckb/__tests__/organization-service.integration.test.ts
 * @description MODULE 4 integration tests against real PostgreSQL. Proves the
 * Universal Organization Registry inherits the GCKB lifecycle: build a corporate
 * hierarchy (parent → subsidiary → factory/warehouse) with addresses, bank
 * accounts and licences linked by typed edges, search, import, and RLS isolation.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { withTenant } from '../../db/prisma';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { ORG_RELATIONSHIP_TYPES } from '../registries/organization';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'org-admin', actorRole: 'PLATFORM_ADMIN', ip: '10.0.0.6', source: 'test' };
}

describe('organization registry (PostgreSQL)', () => {
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

  it('models a corporate hierarchy with units, address, bank account and licence', async () => {
    const ctx = ctxFor(orgA);
    const parent = await gckbService.create(ctx, 'organization', { name: 'Acme Group', attributes: { orgType: 'PARENT', leiCode: '5493001KJTIIGC8Y1R12', countryCode: 'IN' } });
    const sub = await gckbService.create(ctx, 'organization', { name: 'Acme Foods Ltd', attributes: { orgType: 'SUBSIDIARY', registrationNumber: 'U15490', parentOrganizationKey: parent.recordKey } });
    const factory = await gckbService.create(ctx, 'org_unit', { name: 'Pune Factory', code: 'PUNE-FAC', attributes: { unitType: 'FACTORY', organizationKey: sub.recordKey, countryCode: 'IN' } });
    const address = await gckbService.create(ctx, 'org_address', { name: 'Pune HQ', code: 'PUNE-ADDR', attributes: { addressType: 'FACTORY', city: 'Pune', countryCode: 'IN' } });
    const bank = await gckbService.create(ctx, 'bank_account', { name: 'Settlement account', attributes: { iban: 'DE89370400440532013000', currency: 'EUR' } });
    const licence = await gckbService.create(ctx, 'org_license', { name: 'Import licence', attributes: { licenseType: 'IMPORT', number: 'IMP-001', countryCode: 'IN' } });

    await gckbService.addRelationship(ctx, sub.id, { relationType: ORG_RELATIONSHIP_TYPES.SUBSIDIARY_OF, toType: 'organization', toId: parent.id });
    await gckbService.addRelationship(ctx, sub.id, { relationType: ORG_RELATIONSHIP_TYPES.HAS_UNIT, toType: 'org_unit', toId: factory.id });
    await gckbService.addRelationship(ctx, factory.id, { relationType: ORG_RELATIONSHIP_TYPES.LOCATED_AT, toType: 'org_address', toId: address.id });
    await gckbService.addRelationship(ctx, sub.id, { relationType: ORG_RELATIONSHIP_TYPES.HAS_BANK_ACCOUNT, toType: 'bank_account', toId: bank.id });
    await gckbService.addRelationship(ctx, sub.id, { relationType: ORG_RELATIONSHIP_TYPES.HOLDS_LICENSE, toType: 'org_license', toId: licence.id });

    const subEdges = await gckbService.listRelationships(ctx, sub.id);
    expect(subEdges).toHaveLength(4);
    expect(subEdges.map((e) => e.relationType)).toContain(ORG_RELATIONSHIP_TYPES.SUBSIDIARY_OF);
  });

  it('searches organizations by keyword and imports units idempotently', async () => {
    const ctx = ctxFor(orgA);
    await gckbService.create(ctx, 'organization', { name: 'Globex Trading', attributes: { orgType: 'PARENT' } });
    expect((await gckbService.search(ctx, { entityType: 'organization', keyword: 'Globex' })).total).toBeGreaterThanOrEqual(1);

    const rows = [
      { name: 'Warehouse A', code: 'WH-A', attributes: { unitType: 'WAREHOUSE' } },
      { name: 'Team Ops', code: 'TEAM-OPS', attributes: { unitType: 'TEAM' } },
    ];
    expect((await gckbService.applyImport(ctx, 'org_unit', rows)).created).toBe(2);
    expect((await gckbService.applyImport(ctx, 'org_unit', rows)).created).toBe(0);
  });

  it('RLS: organizations are tenant-isolated with a shared global baseline', async () => {
    await gckbService.create(ctxFor(null), 'organization', { name: 'Global Carrier', code: 'GLOBAL-CARRIER', attributes: {} });
    await gckbService.create(ctxFor(orgA), 'organization', { name: 'Acme Foods Ltd', attributes: { registrationNumber: 'ACME-1' } });

    const aKeys = (await withTenant(orgA, (tx) => tx.gckbRecord.findMany({ where: { entityType: 'organization' } }))).map((r) => r.recordKey);
    expect(aKeys).toContain('GLOBAL-CARRIER');
    expect(aKeys).toContain('ACME-1');

    const bKeys = (await withTenant(orgB, (tx) => tx.gckbRecord.findMany({ where: { entityType: 'organization' } }))).map((r) => r.recordKey);
    expect(bKeys).toContain('GLOBAL-CARRIER');
    expect(bKeys).not.toContain('ACME-1');
  });
});
