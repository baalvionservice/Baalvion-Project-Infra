/**
 * @file server/gckb/__tests__/document-registry.test.ts
 * @description Unit tests for MODULE 5 — the document_template GCKB registry
 * entity (template validation, natural key, events, relationships). No I/O.
 */
import { describe, it, expect } from 'vitest';
import { getEntityDefinition, isKnownEntity } from '../registry';
import { DOCUMENT_RELATIONSHIP_TYPES } from '../registries/document';

describe('document_template registry', () => {
  const def = getEntityDefinition('document_template')!;

  it('is registered in the document domain', () => {
    expect(isKnownEntity('document_template')).toBe(true);
    expect(def.domain).toBe('document');
  });

  it('keys by DOCUMENTTYPE:code', () => {
    expect(def.deriveRecordKey({ name: 'Standard Invoice', code: 'std', attributes: { documentType: 'commercial_invoice' } })).toBe('COMMERCIAL_INVOICE:STD');
  });

  it('validates a template payload against the template schema', () => {
    const ok = def.validate({
      name: 'Commercial Invoice',
      attributes: {
        documentType: 'COMMERCIAL_INVOICE',
        variables: [{ name: 'invoiceNumber', type: 'string', required: true }],
        sections: [{ id: 'h', type: 'fields', fields: [{ label: 'No', value: '{{invoiceNumber}}' }] }],
      },
    });
    expect(ok.ok).toBe(true);

    const bad = def.validate({ name: 'Broken', attributes: { documentType: 'X', sections: [{ id: 'h', type: 'not-a-type' }] } });
    expect(bad.ok).toBe(false);

    const noType = def.validate({ name: 'NoType', attributes: { variables: [] } });
    expect(noType.ok).toBe(false); // documentType required
  });

  it('emits DOCUMENT_TEMPLATE_* events and declares cross-module edges', () => {
    expect(def.events.created).toBe('DOCUMENT_TEMPLATE_CREATED');
    const rels = (def.relationshipTypes ?? []).map((r) => r.relationType);
    expect(rels).toContain(DOCUMENT_RELATIONSHIP_TYPES.ISSUED_VIA_WORKFLOW);
    expect(rels).toContain(DOCUMENT_RELATIONSHIP_TYPES.RENDERS_CERTIFICATE);
  });
});
