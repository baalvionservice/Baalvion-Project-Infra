/**
 * @file server/gckb/__tests__/product-registry.test.ts
 * @description Unit tests for MODULE 1 — the Universal Product Registry config
 * (product, product_category, brand, manufacturer). No I/O: validation, natural
 * key derivation, events and relationship-type catalog.
 */
import { describe, it, expect } from 'vitest';
import { getEntityDefinition, isKnownEntity, listEntityTypes } from '../registry';
import { PRODUCT_RELATIONSHIP_TYPES } from '../registries/product';
import { KbWriteInput } from '../types';

describe('product registry membership', () => {
  it('registers all four product-domain entity types', () => {
    const types = listEntityTypes();
    for (const t of ['product', 'product_category', 'brand', 'manufacturer']) {
      expect(types).toContain(t);
      expect(isKnownEntity(t)).toBe(true);
    }
  });

  it('tags every product-domain entity with the product domain and form metadata', () => {
    for (const t of ['product', 'product_category', 'brand', 'manufacturer']) {
      const def = getEntityDefinition(t)!;
      expect(def.domain).toBe('product');
      expect(def.formFields && def.formFields.length).toBeGreaterThan(0);
    }
  });

  it('does not make products country-scoped (origin is optional metadata, not a hard FK)', () => {
    expect(getEntityDefinition('product')!.countryScoped).toBe(false);
  });
});

describe('product definition', () => {
  const def = getEntityDefinition('product')!;

  it('derives a natural key from GPID > GTIN > SKU > code > slug(name)', () => {
    expect(def.deriveRecordKey({ name: 'Widget', attributes: { globalProductId: 'GPID-1' } })).toBe('GPID-1');
    expect(def.deriveRecordKey({ name: 'Widget', attributes: { gtin: '0001112223334' } })).toBe('0001112223334');
    expect(def.deriveRecordKey({ name: 'Widget', attributes: { sku: 'SKU-9' } })).toBe('SKU-9');
    expect(def.deriveRecordKey({ name: 'Widget', code: 'C-7', attributes: {} })).toBe('C-7');
    expect(def.deriveRecordKey({ name: 'Basmati Rice 5kg', attributes: {} })).toBe('basmati-rice-5kg');
    expect(def.deriveRecordKey({ name: 'ignored', recordKey: 'EXPLICIT', attributes: {} })).toBe('EXPLICIT');
  });

  it('accepts a fully-specified product payload', () => {
    const input: KbWriteInput = {
      name: 'Basmati Rice 5kg',
      code: 'RICE-BAS-5',
      hsCode: '100630',
      productCategory: 'FOOD/GRAINS',
      attributes: {
        gtin: '8901234567890',
        brand: 'GoldenField',
        manufacturer: 'Acme Foods',
        originCountryCode: 'IN',
        specifications: { grade: 'A', moisturePercent: 12 },
        weight: { net: 5, gross: 5.2, unit: 'kg' },
        volume: { value: 6.1, unit: 'l' },
        shelfLife: { value: 24, unit: 'MONTH' },
        storageConditions: { temperatureMax: 25, temperatureUnit: 'C', humidityMax: 60 },
        packaging: { packageType: 'BAG', unitsPerPackage: 1, materials: ['woven-pp'] },
        tradeMetadata: { unitOfMeasure: 'KG', incoterms: ['FOB', 'CIF'], dutiable: true, currency: 'USD' },
        compliance: { organic: false, frameworks: ['FSSAI'] },
        restrictions: [{ type: 'IMPORT_PERMIT', jurisdictionCode: 'AE', description: 'requires permit' }],
        hsClassifications: [{ hsCode: '1006.30', countryCode: 'IN' }],
      },
    };
    expect(def.validate(input).ok).toBe(true);
  });

  it('rejects malformed nested attributes (weight without a unit)', () => {
    const r = def.validate({ name: 'X', attributes: { weight: { net: 5 } } });
    expect(r.ok).toBe(false);
  });

  it('emits PRODUCT_* lifecycle events', () => {
    expect(def.events.created).toBe('PRODUCT_CREATED');
    expect(def.events.updated).toBe('PRODUCT_UPDATED');
    expect(def.events.archived).toBe('PRODUCT_ARCHIVED');
  });

  it('declares the core product relationship types', () => {
    const rels = (def.relationshipTypes ?? []).map((r) => r.relationType);
    expect(rels).toContain(PRODUCT_RELATIONSHIP_TYPES.MANUFACTURED_BY);
    expect(rels).toContain(PRODUCT_RELATIONSHIP_TYPES.BRANDED_AS);
    expect(rels).toContain(PRODUCT_RELATIONSHIP_TYPES.CLASSIFIED_UNDER_HS);
  });
});

describe('product_category / brand / manufacturer definitions', () => {
  it('derives an uppercase code/slug key for taxonomy and parties', () => {
    expect(getEntityDefinition('product_category')!.deriveRecordKey({ name: 'Grains', attributes: {} })).toBe('GRAINS');
    expect(getEntityDefinition('brand')!.deriveRecordKey({ name: 'Golden Field', code: 'gf', attributes: {} })).toBe('GF');
    expect(getEntityDefinition('manufacturer')!.deriveRecordKey({ name: 'Acme Foods', attributes: {} })).toBe('ACME-FOODS');
  });

  it('validates optional structured attributes', () => {
    expect(getEntityDefinition('product_category')!.validate({ name: 'Grains', attributes: { level: 1, parentCategoryKey: 'FOOD' } }).ok).toBe(true);
    expect(getEntityDefinition('brand')!.validate({ name: 'B', attributes: { website: 'not-a-url' } }).ok).toBe(false);
    expect(getEntityDefinition('manufacturer')!.validate({ name: 'M', attributes: { email: 'bad' } }).ok).toBe(false);
    expect(getEntityDefinition('manufacturer')!.validate({ name: 'M', attributes: { email: 'ops@acme.com', countryCode: 'IN' } }).ok).toBe(true);
  });
});
