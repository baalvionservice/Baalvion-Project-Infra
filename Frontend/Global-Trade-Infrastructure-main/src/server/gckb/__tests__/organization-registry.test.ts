/**
 * @file server/gckb/__tests__/organization-registry.test.ts
 * @description Unit tests for MODULE 4 — the Universal Organization Registry
 * config (organization, org_unit, org_address, bank_account, org_license). No I/O.
 */
import { describe, it, expect } from 'vitest';
import { getEntityDefinition, isKnownEntity } from '../registry';
import { ORG_RELATIONSHIP_TYPES, ORG_UNIT_TYPES } from '../registries/organization';

describe('organization registry membership', () => {
  it('registers all five organization-domain entities', () => {
    for (const t of ['organization', 'org_unit', 'org_address', 'bank_account', 'org_license']) {
      expect(isKnownEntity(t)).toBe(true);
      expect(getEntityDefinition(t)!.domain).toBe('organization');
    }
  });
});

describe('organization definition', () => {
  const def = getEntityDefinition('organization')!;

  it('keys by LEI › registration › DUNS › code › slug (uppercased)', () => {
    expect(def.deriveRecordKey({ name: 'Acme', attributes: { leiCode: '5493001kjtiigc8y1r12' } })).toBe('5493001KJTIIGC8Y1R12');
    expect(def.deriveRecordKey({ name: 'Acme Foods Ltd', attributes: {} })).toBe('ACME-FOODS-LTD');
  });

  it('declares hierarchy + facility + party relationships', () => {
    const rels = (def.relationshipTypes ?? []).map((r) => r.relationType);
    expect(rels).toContain(ORG_RELATIONSHIP_TYPES.SUBSIDIARY_OF);
    expect(rels).toContain(ORG_RELATIONSHIP_TYPES.HAS_UNIT);
    expect(rels).toContain(ORG_RELATIONSHIP_TYPES.HOLDS_CERTIFICATE);
    expect(def.events.created).toBe('ORGANIZATION_CREATED');
  });
});

describe('org_unit definition', () => {
  const def = getEntityDefinition('org_unit')!;

  it('validates unitType against the configurable set (one entity, not five)', () => {
    for (const u of ORG_UNIT_TYPES) {
      expect(def.validate({ name: 'U', attributes: { unitType: u } }).ok).toBe(true);
    }
    expect(def.validate({ name: 'U', attributes: { unitType: 'SPACESHIP' } }).ok).toBe(false);
    expect(def.validate({ name: 'U', attributes: {} }).ok).toBe(false); // unitType required
  });
});

describe('bank_account / org_license keys', () => {
  it('keys a bank account by IBAN and a licence by number', () => {
    expect(getEntityDefinition('bank_account')!.deriveRecordKey({ name: 'Main', attributes: { iban: 'de89370400440532013000' } })).toBe('DE89370400440532013000');
    expect(getEntityDefinition('org_license')!.deriveRecordKey({ name: 'Import licence', attributes: { licenseType: 'IMPORT', number: 'imp-001' } })).toBe('IMP-001');
  });

  it('requires licenseType on a licence', () => {
    expect(getEntityDefinition('org_license')!.validate({ name: 'L', attributes: {} }).ok).toBe(false);
    expect(getEntityDefinition('org_license')!.validate({ name: 'L', attributes: { licenseType: 'EXPORT' } }).ok).toBe(true);
  });
});
