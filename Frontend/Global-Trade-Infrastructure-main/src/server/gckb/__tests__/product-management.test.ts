/**
 * @file server/gckb/__tests__/product-management.test.ts
 * @description Unit tests for the product-management gap-fill: product Media
 * (images), Commercial terms (MOQ) and Variant options on the product entity; the
 * first-class `product_variant` entity; and the `inventory_item` entity. No I/O —
 * validation, natural-key derivation, events and relationship-type catalog.
 */
import { describe, it, expect } from 'vitest';
import { getEntityDefinition, isKnownEntity, listEntityTypes } from '../registry';
import { PRODUCT_RELATIONSHIP_TYPES } from '../registries/product';
import { INVENTORY_RELATIONSHIP_TYPES } from '../registries/inventory';
import { KbWriteInput } from '../types';

describe('product entity — media, MOQ & variant options', () => {
  const def = getEntityDefinition('product')!;

  it('accepts media, commercialTerms (MOQ) and variantOptions', () => {
    const input: KbWriteInput = {
      name: 'Cotton T-Shirt',
      code: 'TSHIRT-CO',
      attributes: {
        media: [
          { url: 'https://cdn.example.com/tshirt/front.jpg', type: 'IMAGE', role: 'PRIMARY', alt: 'Front', sortOrder: 0 },
          { url: 'https://cdn.example.com/tshirt/spec.pdf', type: 'DOCUMENT', role: 'SPEC_SHEET' },
        ],
        commercialTerms: {
          minimumOrderQuantity: 100,
          orderIncrement: 50,
          unitOfMeasure: 'PCS',
          leadTimeDays: 21,
          currency: 'USD',
          unitPrice: 3.5,
          priceBreaks: [
            { minQuantity: 100, unitPrice: 3.5 },
            { minQuantity: 1000, unitPrice: 2.9, currency: 'USD' },
          ],
        },
        variantOptions: [
          { name: 'Colour', values: ['Red', 'Blue', 'Black'] },
          { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
        ],
      },
    };
    expect(def.validate(input).ok).toBe(true);
  });

  it('rejects a media item without a valid URL', () => {
    expect(def.validate({ name: 'X', attributes: { media: [{ role: 'PRIMARY' }] } }).ok).toBe(false);
    expect(def.validate({ name: 'X', attributes: { media: [{ url: 'not-a-url' }] } }).ok).toBe(false);
  });

  it('rejects a non-positive MOQ and a malformed variant option (no values)', () => {
    expect(def.validate({ name: 'X', attributes: { commercialTerms: { minimumOrderQuantity: 0 } } }).ok).toBe(false);
    expect(def.validate({ name: 'X', attributes: { variantOptions: [{ name: 'Colour', values: [] }] } }).ok).toBe(false);
  });

  it('surfaces the new fields in the Admin-UI form metadata', () => {
    const names = (def.formFields ?? []).map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['media', 'commercialTerms', 'variantOptions']));
  });
});

describe('product_variant entity', () => {
  it('is registered in the product domain with form metadata', () => {
    expect(isKnownEntity('product_variant')).toBe(true);
    expect(listEntityTypes()).toContain('product_variant');
    const def = getEntityDefinition('product_variant')!;
    expect(def.domain).toBe('product');
    expect(def.countryScoped).toBe(false);
    expect(def.formFields && def.formFields.length).toBeGreaterThan(0);
  });

  it('derives a key from SKU > GTIN > code, else parent + option values, else slug', () => {
    const def = getEntityDefinition('product_variant')!;
    expect(def.deriveRecordKey({ name: 'V', attributes: { parentProductKey: 'P', sku: 'SKU-1' } })).toBe('SKU-1');
    expect(def.deriveRecordKey({ name: 'V', attributes: { parentProductKey: 'P', gtin: '0001112223334' } })).toBe('0001112223334');
    // composite is order-independent (sorted) and uppercased
    expect(
      def.deriveRecordKey({ name: 'V', attributes: { parentProductKey: 'tshirt-co', optionValues: { Size: 'M', Colour: 'Red' } } }),
    ).toBe('TSHIRT-CO:COLOUR=RED/SIZE=M');
    expect(def.deriveRecordKey({ name: 'Lone Variant', attributes: { parentProductKey: 'P' } })).toBe('lone-variant');
    expect(def.deriveRecordKey({ name: 'ignored', recordKey: 'EXPLICIT', attributes: { parentProductKey: 'P' } })).toBe('EXPLICIT');
  });

  it('requires a parent product key', () => {
    const def = getEntityDefinition('product_variant')!;
    expect(def.validate({ name: 'V', attributes: {} }).ok).toBe(false);
    expect(def.validate({ name: 'V', attributes: { parentProductKey: 'P' } }).ok).toBe(true);
  });

  it('accepts a fully-specified variant payload (options, price, MOQ, media)', () => {
    const def = getEntityDefinition('product_variant')!;
    const input: KbWriteInput = {
      name: 'Cotton T-Shirt — Red / M',
      code: 'TSHIRT-CO-RED-M',
      attributes: {
        parentProductKey: 'TSHIRT-CO',
        optionValues: { Colour: 'Red', Size: 'M' },
        barcode: '8901234567001',
        price: { currency: 'USD', amount: 4.25 },
        commercialTerms: { minimumOrderQuantity: 50, orderIncrement: 25 },
        media: [{ url: 'https://cdn.example.com/tshirt/red-m.jpg', type: 'IMAGE', role: 'PRIMARY' }],
        weight: { net: 0.18, unit: 'kg' },
        variantStatus: 'ACTIVE',
      },
    };
    expect(def.validate(input).ok).toBe(true);
  });

  it('emits PRODUCT_VARIANT_* events and a VARIANT_OF edge to the parent product', () => {
    const def = getEntityDefinition('product_variant')!;
    expect(def.events.created).toBe('PRODUCT_VARIANT_CREATED');
    expect(def.events.updated).toBe('PRODUCT_VARIANT_UPDATED');
    expect(def.events.archived).toBe('PRODUCT_VARIANT_ARCHIVED');
    const edge = (def.relationshipTypes ?? []).find((r) => r.relationType === PRODUCT_RELATIONSHIP_TYPES.VARIANT_OF);
    expect(edge).toBeTruthy();
    expect(edge!.toType).toBe('product');
  });
});

describe('inventory_item entity', () => {
  const def = getEntityDefinition('inventory_item')!;

  it('is registered in the inventory domain with form metadata', () => {
    expect(isKnownEntity('inventory_item')).toBe(true);
    expect(def.domain).toBe('inventory');
    expect(def.countryScoped).toBe(false);
    expect(def.formFields && def.formFields.length).toBeGreaterThan(0);
  });

  it('keys a stock position by stocked-item @ location (uppercased)', () => {
    expect(def.deriveRecordKey({ name: 'Stock', attributes: { variantKey: 'TSHIRT-CO-RED-M', locationCode: 'wh-mumbai' } })).toBe('TSHIRT-CO-RED-M@WH-MUMBAI');
    expect(def.deriveRecordKey({ name: 'Stock', attributes: { sku: 'sku-1', locationCode: 'WH1' } })).toBe('SKU-1@WH1');
    expect(def.deriveRecordKey({ name: 'Stock', attributes: { productKey: 'P', locationCode: 'WH1' } })).toBe('P@WH1');
    expect(def.deriveRecordKey({ name: 'Stock', attributes: { sku: 'S' } })).toBe('S@DEFAULT');
  });

  it('requires a stocked item, a location and on-hand quantity', () => {
    expect(def.validate({ name: 'S', attributes: { quantityOnHand: 10, locationCode: 'WH1' } }).ok).toBe(false); // no item
    expect(def.validate({ name: 'S', attributes: { sku: 'S', quantityOnHand: 10 } }).ok).toBe(false); // no location
    expect(def.validate({ name: 'S', attributes: { sku: 'S', locationCode: 'WH1' } }).ok).toBe(false); // no quantity
    expect(def.validate({ name: 'S', attributes: { sku: 'S', locationCode: 'WH1', quantityOnHand: 10 } }).ok).toBe(true);
  });

  it('rejects negative quantities', () => {
    expect(def.validate({ name: 'S', attributes: { sku: 'S', locationCode: 'WH1', quantityOnHand: -1 } }).ok).toBe(false);
    expect(def.validate({ name: 'S', attributes: { sku: 'S', locationCode: 'WH1', quantityOnHand: 5, quantityReserved: -2 } }).ok).toBe(false);
  });

  it('accepts a fully-specified stock position with reorder + lot tracking', () => {
    const input: KbWriteInput = {
      name: 'T-Shirt Red/M — Mumbai DC',
      code: 'TSHIRT-CO-RED-M',
      attributes: {
        variantKey: 'TSHIRT-CO-RED-M',
        productKey: 'TSHIRT-CO',
        locationCode: 'WH-MUMBAI',
        warehouseName: 'Mumbai DC',
        quantityOnHand: 1200,
        quantityReserved: 200,
        quantityIncoming: 500,
        reorderPoint: 300,
        reorderQuantity: 1000,
        safetyStock: 150,
        unitOfMeasure: 'PCS',
        lotNumber: 'LOT-2026-06',
        expiryDate: '2027-06-01',
        stockStatus: 'IN_STOCK',
      },
    };
    expect(def.validate(input).ok).toBe(true);
  });

  it('declares STOCK_OF / STOCK_OF_VARIANT / STORED_AT edges', () => {
    const rels = (def.relationshipTypes ?? []).map((r) => r.relationType);
    expect(rels).toContain(INVENTORY_RELATIONSHIP_TYPES.STOCK_OF);
    expect(rels).toContain(INVENTORY_RELATIONSHIP_TYPES.STOCK_OF_VARIANT);
    expect(rels).toContain(INVENTORY_RELATIONSHIP_TYPES.STORED_AT);
    expect(def.events.created).toBe('INVENTORY_ITEM_CREATED');
  });
});
