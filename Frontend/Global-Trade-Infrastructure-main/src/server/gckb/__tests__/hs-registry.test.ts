/**
 * @file server/gckb/__tests__/hs-registry.test.ts
 * @description Unit tests for MODULE 2 — the Global HS Registry config. No I/O:
 * level validation, hierarchical/national natural keys, events and the
 * relationship-type catalog.
 */
import { describe, it, expect } from 'vitest';
import { getEntityDefinition, isKnownEntity } from '../registry';
import { HS_LEVELS, HS_RELATIONSHIP_TYPES } from '../registries/hs-code';

describe('hs_code registry membership', () => {
  it('registers the hs_code entity in the hs domain', () => {
    expect(isKnownEntity('hs_code')).toBe(true);
    const def = getEntityDefinition('hs_code')!;
    expect(def.domain).toBe('hs');
    expect(def.countryScoped).toBe(false);
    expect((def.formFields ?? []).length).toBeGreaterThan(0);
  });
});

describe('hs_code definition', () => {
  const def = getEntityDefinition('hs_code')!;

  it('derives the HS code as the natural key, normalising dots/spaces', () => {
    expect(def.deriveRecordKey({ name: 'Rice', hsCode: '1006.30', attributes: { level: 6 } })).toBe('100630');
    expect(def.deriveRecordKey({ name: 'Rice', hsCode: '1006 30', attributes: { level: 6 } })).toBe('100630');
  });

  it('prefixes the country code for national extensions', () => {
    const key = def.deriveRecordKey({ name: 'Basmati line', hsCode: '10063010', attributes: { level: 8, countryCode: 'in' } });
    expect(key).toBe('IN:10063010');
  });

  it('accepts only valid HS levels (2/4/6/8/10)', () => {
    for (const lvl of HS_LEVELS) {
      expect(def.validate({ name: 'x', hsCode: '12', attributes: { level: lvl } }).ok).toBe(true);
    }
    expect(def.validate({ name: 'x', hsCode: '123', attributes: { level: 3 } }).ok).toBe(false);
    expect(def.validate({ name: 'x', hsCode: '12', attributes: {} }).ok).toBe(false); // level required
  });

  it('accepts a full HS payload with notes and edition', () => {
    const r = def.validate({
      name: 'Rice, semi-milled or wholly milled',
      hsCode: '100630',
      attributes: {
        level: 6,
        parentHsCode: '1006',
        section: 'II',
        chapter: '10',
        edition: 'HS2022',
        unitOfQuantity: 'KG',
        explanatoryNotes: 'Covers semi-milled and wholly milled rice.',
        inclusions: ['semi-milled rice'],
        exclusions: ['rice in the husk'],
        keywords: ['rice', 'cereal'],
      },
    });
    expect(r.ok).toBe(true);
  });

  it('emits HS_CODE_* events and declares hierarchy relationships', () => {
    expect(def.events.created).toBe('HS_CODE_CREATED');
    const rels = (def.relationshipTypes ?? []).map((r) => r.relationType);
    expect(rels).toContain(HS_RELATIONSHIP_TYPES.SUBHEADING_OF);
    expect(rels).toContain(HS_RELATIONSHIP_TYPES.NATIONAL_EXTENSION_OF);
  });
});
