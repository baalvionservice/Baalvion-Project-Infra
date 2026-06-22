/**
 * @file server/gckb/__tests__/certificate-service.integration.test.ts
 * @description MODULE 3 integration tests against real PostgreSQL. Proves the
 * Certificate Registry inherits the GCKB lifecycle: catalogue a certificate type,
 * issue an instance, link them (INSTANCE_OF / ISSUED_BY), renew (SUPERSEDES),
 * search, import, and enforce RLS tenant isolation — no certificate-specific
 * persistence code.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { withTenant } from '../../db/prisma';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { CERTIFICATE_RELATIONSHIP_TYPES } from '../registries/certificate';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'cert-admin', actorRole: 'PLATFORM_ADMIN', ip: '10.0.0.8', source: 'test' };
}

describe('certificate registry (PostgreSQL)', () => {
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

  it('catalogues a certificate type, issues an instance, and links them', async () => {
    const ctx = ctxFor(orgA);
    const type = await gckbService.create(ctx, 'certificate_type', {
      name: 'Certificate of Origin',
      code: 'COO',
      attributes: { category: 'ORIGIN', mandatory: true, defaultValidityMonths: 12, qrVerification: { supported: true, urlTemplate: 'https://verify.gov/{serial}' } },
    });
    expect(type.recordKey).toBe('COO');

    const issued = await gckbService.create(ctx, 'certificate', {
      name: 'CoO for shipment 42',
      attributes: { certificateTypeKey: 'COO', serialNumber: 'COO-2026-001', validFrom: '2026-01-01', validTo: '2026-12-31', certificateStatus: 'VALID', digitalSignature: { standard: 'eIDAS', signatureValue: 'base64sig' } },
    });
    expect(issued.recordKey).toBe('COO-2026-001');

    await gckbService.addRelationship(ctx, issued.id, { relationType: CERTIFICATE_RELATIONSHIP_TYPES.INSTANCE_OF, toType: 'certificate_type', toId: type.id });
    expect(await gckbService.listRelationships(ctx, issued.id)).toHaveLength(1);
  });

  it('renews a certificate (new instance supersedes the prior one)', async () => {
    const ctx = ctxFor(orgA);
    await gckbService.create(ctx, 'certificate_type', { name: 'CoO', code: 'COO', attributes: {} });
    const first = await gckbService.create(ctx, 'certificate', { name: 'CoO v1', attributes: { certificateTypeKey: 'COO', serialNumber: 'COO-2025-009', validTo: '2025-12-31', certificateStatus: 'EXPIRED' } });
    const renewal = await gckbService.create(ctx, 'certificate', { name: 'CoO v2', attributes: { certificateTypeKey: 'COO', serialNumber: 'COO-2026-009', validTo: '2026-12-31', certificateStatus: 'VALID', renewal: { renews: true, supersedesCertificateKey: 'COO-2025-009' } } });

    await gckbService.addRelationship(ctx, renewal.id, { relationType: CERTIFICATE_RELATIONSHIP_TYPES.SUPERSEDES, toType: 'certificate', toId: first.id });
    expect((await gckbService.listRelationships(ctx, renewal.id)).map((r) => r.relationType)).toContain(CERTIFICATE_RELATIONSHIP_TYPES.SUPERSEDES);
  });

  it('searches certificate types by keyword and imports a batch idempotently', async () => {
    const ctx = ctxFor(orgA);
    const rows = [
      { name: 'Certificate of Origin', code: 'COO', attributes: { category: 'ORIGIN' } },
      { name: 'Phytosanitary Certificate', code: 'PHYTO', attributes: { category: 'HEALTH' } },
    ];
    const first = await gckbService.applyImport(ctx, 'certificate_type', rows);
    expect(first.created).toBe(2);
    const second = await gckbService.applyImport(ctx, 'certificate_type', rows);
    expect(second.created).toBe(0);

    expect((await gckbService.search(ctx, { entityType: 'certificate_type', keyword: 'Phytosanitary' })).total).toBeGreaterThanOrEqual(1);
  });

  it('RLS: certificate types are tenant-isolated with a shared global baseline', async () => {
    await gckbService.create(ctxFor(null), 'certificate_type', { name: 'CE Marking', code: 'CE', attributes: {} }); // global
    await gckbService.create(ctxFor(orgA), 'certificate_type', { name: 'Halal', code: 'HALAL', attributes: {} }); // Org A

    const aKeys = (await withTenant(orgA, (tx) => tx.gckbRecord.findMany({ where: { entityType: 'certificate_type' } }))).map((r) => r.recordKey);
    expect(aKeys).toContain('CE');
    expect(aKeys).toContain('HALAL');

    const bKeys = (await withTenant(orgB, (tx) => tx.gckbRecord.findMany({ where: { entityType: 'certificate_type' } }))).map((r) => r.recordKey);
    expect(bKeys).toContain('CE');
    expect(bKeys).not.toContain('HALAL');
  });
});
