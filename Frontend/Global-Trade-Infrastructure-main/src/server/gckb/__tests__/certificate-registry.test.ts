/**
 * @file server/gckb/__tests__/certificate-registry.test.ts
 * @description Unit tests for MODULE 3 — the Global Certificate Registry config
 * (certificate_type catalogue + issued certificate instances). No I/O.
 */
import { describe, it, expect } from 'vitest';
import { getEntityDefinition, isKnownEntity } from '../registry';
import { CERTIFICATE_RELATIONSHIP_TYPES } from '../registries/certificate';

describe('certificate registry membership', () => {
  it('registers certificate_type and certificate in the certificate domain', () => {
    for (const t of ['certificate_type', 'certificate']) {
      expect(isKnownEntity(t)).toBe(true);
      expect(getEntityDefinition(t)!.domain).toBe('certificate');
    }
  });
});

describe('certificate_type definition', () => {
  const def = getEntityDefinition('certificate_type')!;

  it('derives an uppercase code/slug key', () => {
    expect(def.deriveRecordKey({ name: 'Certificate of Origin', attributes: {} })).toBe('CERTIFICATE-OF-ORIGIN');
    expect(def.deriveRecordKey({ name: 'CoO', code: 'coo', attributes: {} })).toBe('COO');
  });

  it('validates rich validity / signature / QR metadata', () => {
    const r = def.validate({
      name: 'Certificate of Origin',
      attributes: {
        category: 'ORIGIN',
        mandatory: true,
        defaultValidityMonths: 12,
        renewable: true,
        renewalLeadDays: 30,
        digitalSignature: { standard: 'eIDAS', required: true },
        qrVerification: { supported: true, urlTemplate: 'https://verify.gov/{serial}' },
        appliesToHsCodes: ['1006'],
        appliesToCountries: ['IN', 'AE'],
      },
    });
    expect(r.ok).toBe(true);
  });

  it('emits CERTIFICATE_TYPE_* events and declares ISSUED_BY / workflow / rule edges', () => {
    expect(def.events.created).toBe('CERTIFICATE_TYPE_CREATED');
    const rels = (def.relationshipTypes ?? []).map((r) => r.relationType);
    expect(rels).toContain(CERTIFICATE_RELATIONSHIP_TYPES.ISSUED_BY);
    expect(rels).toContain(CERTIFICATE_RELATIONSHIP_TYPES.VERIFIED_BY_WORKFLOW);
    expect(rels).toContain(CERTIFICATE_RELATIONSHIP_TYPES.ENFORCED_BY_RULE);
  });
});

describe('certificate (issued instance) definition', () => {
  const def = getEntityDefinition('certificate')!;

  it('requires a certificateTypeKey', () => {
    expect(def.validate({ name: 'X', attributes: {} }).ok).toBe(false);
    expect(def.validate({ name: 'X', attributes: { certificateTypeKey: 'COO' } }).ok).toBe(true);
  });

  it('keys by serial number when present', () => {
    expect(def.deriveRecordKey({ name: 'CoO #1', attributes: { certificateTypeKey: 'COO', serialNumber: 'COO-2026-001' } })).toBe('COO-2026-001');
  });

  it('emits CERTIFICATE_ISSUED on create', () => {
    expect(def.events.created).toBe('CERTIFICATE_ISSUED');
  });
});
