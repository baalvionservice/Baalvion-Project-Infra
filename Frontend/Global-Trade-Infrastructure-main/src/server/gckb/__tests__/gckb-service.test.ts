/**
 * @file server/gckb/__tests__/gckb-service.test.ts
 * @description Integration tests for the GCKB service against real PostgreSQL:
 * create/version/history/compare, search, relationships, archive, RLS
 * (global + tenant), append-only revisions, domain events, and bulk import
 * (commit / unchanged / rollback / preview).
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { prisma, withTenant } from '../../db/prisma';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { parseImport, validateImport } from '../import-engine';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'kb-admin', actorRole: 'PLATFORM_ADMIN', ip: '10.0.0.5', source: 'test' };
}

async function seedCountry(ctx: KbActorContext, alpha2: string, name: string) {
  return gckbService.create(ctx, 'country', {
    name,
    code: alpha2,
    status: 'PUBLISHED',
    attributes: { alpha2, alpha3: `${alpha2}X`, officialName: name },
  });
}

describe('gckb-service (PostgreSQL)', () => {
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

  it('creates a country and a country-scoped policy with resolved FK', async () => {
    const ctx = ctxFor(orgA);
    const us = await seedCountry(ctx, 'US', 'United States');
    expect(us.recordKey).toBe('US');
    expect(us.version).toBe(1);

    const vat = await gckbService.create(ctx, 'country_policy', {
      name: 'Standard VAT',
      countryCode: 'US',
      policyType: 'tax',
      hsCode: '1006',
      attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 20 },
    });
    expect(vat.countryId).toBe(us.id);
    expect(vat.policyType).toBe('tax');
    expect(vat.recordKey).toBe('US:tax:standard-vat');
  });

  it('rejects a policy for an unknown country and an unknown policy type', async () => {
    const ctx = ctxFor(orgA);
    await expect(
      gckbService.create(ctx, 'country_policy', { name: 'X', countryCode: 'ZZ', policyType: 'tax', attributes: { taxName: 'V', taxType: 'VAT', ratePercent: 1 } }),
    ).rejects.toThrow(/not in the knowledge base/);

    await seedCountry(ctx, 'US', 'United States');
    await expect(
      gckbService.create(ctx, 'country_policy', { name: 'X', countryCode: 'US', policyType: 'bogus', attributes: {} }),
    ).rejects.toThrow(/policy type/i);
  });

  it('versions on change, preserves history, and supports comparison + no-op detection', async () => {
    const ctx = ctxFor(orgA);
    await seedCountry(ctx, 'US', 'United States');
    const vat = await gckbService.create(ctx, 'country_policy', {
      name: 'Standard VAT',
      countryCode: 'US',
      policyType: 'tax',
      attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 20 },
    });

    const v2 = await gckbService.update(ctx, vat.id, { attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 18 }, reason: 'rate cut' });
    expect(v2.version).toBe(2);

    const noop = await gckbService.update(ctx, vat.id, { attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 18 } });
    expect(noop.version).toBe(2); // unchanged content → no new version

    const history = await gckbService.history(ctx, vat.id);
    expect(history.map((h) => h.version)).toEqual([2, 1]);

    const cmp = await gckbService.compareVersions(ctx, vat.id, 1, 2);
    expect((cmp.a.snapshot as { attributes: { ratePercent: number } }).attributes.ratePercent).toBe(20);
    expect((cmp.b.snapshot as { attributes: { ratePercent: number } }).attributes.ratePercent).toBe(18);
  });

  it('searches by country, HS code, policy type and keyword', async () => {
    const ctx = ctxFor(orgA);
    await seedCountry(ctx, 'US', 'United States');
    await gckbService.create(ctx, 'country_policy', { name: 'Standard VAT', countryCode: 'US', policyType: 'tax', hsCode: '1006', attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 20 } });

    expect((await gckbService.search(ctx, { entityType: 'country_policy', countryCode: 'US' })).total).toBe(1);
    expect((await gckbService.search(ctx, { hsCode: '1006' })).total).toBe(1);
    expect((await gckbService.search(ctx, { policyType: 'tax' })).total).toBe(1);
    expect((await gckbService.search(ctx, { keyword: 'VAT' })).total).toBeGreaterThanOrEqual(1);
    expect((await gckbService.search(ctx, { countryCode: 'ZZ' })).total).toBe(0);
  });

  it('adds and lists relationships, and hides archived records from search', async () => {
    const ctx = ctxFor(orgA);
    await seedCountry(ctx, 'US', 'United States');
    const vat = await gckbService.create(ctx, 'country_policy', { name: 'Standard VAT', countryCode: 'US', policyType: 'tax', attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 20 } });

    await gckbService.addRelationship(ctx, vat.id, { relationType: 'APPLIES_TO_HS', toType: 'hs_code', toRef: '1006' });
    expect(await gckbService.listRelationships(ctx, vat.id)).toHaveLength(1);

    await gckbService.archive(ctx, vat.id, 'superseded');
    expect((await gckbService.search(ctx, { entityType: 'country_policy', countryCode: 'US' })).total).toBe(0);
  });

  it('emits domain events including CERTIFICATE_ADDED for certificate policies', async () => {
    const ctx = ctxFor(orgA);
    await seedCountry(ctx, 'US', 'United States');
    await gckbService.create(ctx, 'country_policy', { name: 'Certificate of Origin', countryCode: 'US', policyType: 'certificate', attributes: { certificateName: 'CoO', mandatory: true } });

    expect((await prisma.domainEvent.findMany({ where: { type: 'COUNTRY_CREATED' } })).length).toBeGreaterThanOrEqual(1);
    expect((await prisma.domainEvent.findMany({ where: { type: 'POLICY_CREATED' } })).length).toBeGreaterThanOrEqual(1);
    expect((await prisma.domainEvent.findMany({ where: { type: 'CERTIFICATE_ADDED' } })).length).toBeGreaterThanOrEqual(1);
  });

  it('RLS: tenants see the global baseline + their own records, never another tenant\'s', async () => {
    await seedCountry(ctxFor(null), 'DE', 'Germany'); // global baseline (NULL org)
    await seedCountry(ctxFor(orgA), 'US', 'United States'); // Org A only

    const aKeys = (await withTenant(orgA, (tx) => tx.gckbRecord.findMany())).map((r) => r.recordKey);
    expect(aKeys).toContain('DE');
    expect(aKeys).toContain('US');

    const bKeys = (await withTenant(orgB, (tx) => tx.gckbRecord.findMany())).map((r) => r.recordKey);
    expect(bKeys).toContain('DE');
    expect(bKeys).not.toContain('US');
  });

  it('gckb_revisions are immutable at the database layer (append-only trigger)', async () => {
    await seedCountry(ctxFor(orgA), 'US', 'United States');
    await expect(prisma.gckbRevision.updateMany({ where: {}, data: { reason: 'tamper' } })).rejects.toThrow();
    await expect(prisma.gckbRevision.deleteMany({ where: {} })).rejects.toThrow();
  });

  it('imports a batch transactionally, is idempotent, and rolls back on any error', async () => {
    const ctx = ctxFor(orgA);
    await seedCountry(ctx, 'US', 'United States');

    const rows = validateImport(
      'country_policy',
      parseImport('json', JSON.stringify([
        { name: 'VAT', countryCode: 'US', policyType: 'tax', attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 20 } },
        { name: 'Excise', countryCode: 'US', policyType: 'tax', attributes: { taxName: 'Excise', taxType: 'EXCISE', ratePercent: 5 } },
      ])),
    ).validInputs;

    const first = await gckbService.applyImport(ctx, 'country_policy', rows);
    expect(first.created).toBe(2);

    const second = await gckbService.applyImport(ctx, 'country_policy', rows);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0); // unchanged checksums skip

    // A batch with a row referencing a missing country rolls the whole batch back.
    const bad = validateImport(
      'country_policy',
      parseImport('json', JSON.stringify([
        { name: 'New Duty', countryCode: 'US', policyType: 'duty', attributes: { dutyType: 'CUSTOMS', ratePercent: 3 } },
        { name: 'Orphan', countryCode: 'ZZ', policyType: 'duty', attributes: { dutyType: 'CUSTOMS', ratePercent: 3 } },
      ])),
    ).validInputs;
    await expect(gckbService.applyImport(ctx, 'country_policy', bad)).rejects.toThrow();
    expect((await gckbService.search(ctx, { entityType: 'country_policy', policyType: 'duty' })).total).toBe(0);
  });

  it('previewImport classifies create vs unchanged without writing', async () => {
    const ctx = ctxFor(orgA);
    await seedCountry(ctx, 'US', 'United States');
    const rows = validateImport(
      'country_policy',
      parseImport('json', JSON.stringify([{ name: 'VAT', countryCode: 'US', policyType: 'tax', attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 20 } }])),
    ).validInputs;

    const preview = await gckbService.previewImport(ctx, 'country_policy', rows);
    expect(preview.willCreate).toBe(1);
    // Nothing was written by preview:
    expect((await gckbService.search(ctx, { entityType: 'country_policy' })).total).toBe(0);

    await gckbService.applyImport(ctx, 'country_policy', rows);
    const preview2 = await gckbService.previewImport(ctx, 'country_policy', rows);
    expect(preview2.unchanged).toBe(1);
  });
});
