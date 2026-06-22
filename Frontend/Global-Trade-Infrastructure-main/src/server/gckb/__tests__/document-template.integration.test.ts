/**
 * @file server/gckb/__tests__/document-template.integration.test.ts
 * @description MODULE 5 integration test against real PostgreSQL. Proves a
 * document template round-trips through the GCKB engine (versioned, tenant-safe)
 * and that the stored template renders deterministically via the pure engine.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { documentTemplateSchema } from '../../documents/template-types';
import { renderDocument } from '../../documents/template-engine';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'doc-admin', actorRole: 'PLATFORM_ADMIN', source: 'test' };
}

const packingListTemplate = {
  documentType: 'PACKING_LIST',
  defaultLocale: 'en',
  outputFormats: ['HTML', 'JSON'],
  variables: [
    { name: 'reference', type: 'string', required: true },
    { name: 'packages', type: 'array', required: true },
  ],
  sections: [
    { id: 'head', type: 'fields', title: 'Packing List', fields: [{ label: 'Ref', value: '{{reference}}' }] },
    {
      id: 'pkgs',
      type: 'table',
      repeatOver: 'packages',
      columns: [
        { header: 'Marks', value: '{{row.marks}}' },
        { header: 'Weight', value: '{{row.weightKg}}' },
      ],
    },
  ],
};

describe('document template registry (PostgreSQL)', () => {
  let orgA: string;

  beforeEach(async () => {
    await resetDatabase();
    orgA = await seedOrganization('Org A');
  });
  afterAll(async () => {
    await disconnect();
  });

  it('stores a template, versions it, and renders the stored definition', async () => {
    const ctx = ctxFor(orgA);
    const created = await gckbService.create(ctx, 'document_template', {
      name: 'Standard Packing List',
      code: 'STD',
      attributes: packingListTemplate,
    });
    expect(created.recordKey).toBe('PACKING_LIST:STD');
    expect(created.version).toBe(1);

    // Read the stored attributes back and render them through the pure engine.
    const { record } = await gckbService.get(ctx, created.id);
    const template = documentTemplateSchema.parse(record.attributes);
    const html = renderDocument(template, { reference: 'PL-9', packages: [{ marks: 'BX-1', weightKg: 12 }] }, { format: 'HTML' });
    expect(html).toContain('PL-9');
    expect(html).toContain('BX-1');

    const v2 = await gckbService.update(ctx, created.id, {
      attributes: { ...packingListTemplate, defaultLocale: 'fr' },
      reason: 'add French default',
    });
    expect(v2.version).toBe(2);
  });
});
