/**
 * @file server/gckb/__tests__/registry.test.ts
 * @description Unit tests for the entity registry + policy-type catalog. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { getEntityDefinition, listEntityTypes, isKnownEntity, POLICY_TYPE_KEYS } from '../registry';
import { KbWriteInput } from '../types';

describe('registry membership', () => {
  it('registers all ten core entity types', () => {
    const types = listEntityTypes();
    for (const t of ['country', 'currency', 'language', 'timezone', 'trade_region', 'subdivision', 'authority', 'point_of_entry', 'trade_agreement', 'country_policy']) {
      expect(types).toContain(t);
    }
    expect(isKnownEntity('country')).toBe(true);
    expect(isKnownEntity('nonsense')).toBe(false);
    expect(getEntityDefinition('nonsense')).toBeNull();
  });

  it('exposes the full policy-type catalog (19 types)', () => {
    expect(POLICY_TYPE_KEYS.length).toBe(19);
    for (const k of ['tax', 'tariff', 'duty', 'certificate', 'license', 'restricted_goods', 'prohibited_goods', 'sanctions_metadata', 'digital_api', 'signature_standard']) {
      expect(POLICY_TYPE_KEYS).toContain(k);
    }
  });
});

describe('country definition', () => {
  const def = getEntityDefinition('country')!;
  it('derives an uppercase alpha-2 record key', () => {
    const input: KbWriteInput = { name: 'United States', attributes: { alpha2: 'us', alpha3: 'usa' } };
    expect(def.deriveRecordKey(input)).toBe('US');
  });
  it('validates required ISO fields', () => {
    expect(def.validate({ name: 'X', attributes: { alpha2: 'US', alpha3: 'USA' } }).ok).toBe(true);
    const bad = def.validate({ name: 'X', attributes: { alpha2: 'USA' } });
    expect(bad.ok).toBe(false);
  });
  it('emits COUNTRY_CREATED', () => {
    expect(def.events.created).toBe('COUNTRY_CREATED');
  });
});

describe('country_policy definition', () => {
  const def = getEntityDefinition('country_policy')!;

  it('rejects an unknown policy type', () => {
    const r = def.validate({ name: 'X', countryCode: 'US', policyType: 'bogus', attributes: {} });
    expect(r.ok).toBe(false);
  });

  it('validates attributes against the selected policy type', () => {
    const ok = def.validate({ name: 'VAT', countryCode: 'US', policyType: 'tax', attributes: { taxName: 'VAT', taxType: 'VAT', ratePercent: 20 } });
    expect(ok.ok).toBe(true);
    const bad = def.validate({ name: 'VAT', countryCode: 'US', policyType: 'tax', attributes: { taxName: 'VAT' } });
    expect(bad.ok).toBe(false);
  });

  it('derives a composite country:policyType:key record key', () => {
    const key = def.deriveRecordKey({ name: 'Standard VAT', countryCode: 'us', policyType: 'tax', attributes: {} });
    expect(key).toBe('US:tax:standard-vat');
  });

  it('emits POLICY_CREATED plus CERTIFICATE_ADDED for certificate policies', () => {
    expect(def.events.created).toBe('POLICY_CREATED');
    const extra = def.extraCreatedEvents?.({ name: 'CoO', countryCode: 'US', policyType: 'certificate', attributes: {} }) ?? [];
    expect(extra).toContain('CERTIFICATE_ADDED');
    const none = def.extraCreatedEvents?.({ name: 'VAT', countryCode: 'US', policyType: 'tax', attributes: {} }) ?? [];
    expect(none).toEqual([]);
  });
});

describe('country-scoped enforcement', () => {
  it('marks policy/subdivision/point_of_entry as country-scoped', () => {
    expect(getEntityDefinition('country_policy')!.countryScoped).toBe(true);
    expect(getEntityDefinition('subdivision')!.countryScoped).toBe(true);
    expect(getEntityDefinition('point_of_entry')!.countryScoped).toBe(true);
    expect(getEntityDefinition('country')!.countryScoped).toBe(false);
  });
});
