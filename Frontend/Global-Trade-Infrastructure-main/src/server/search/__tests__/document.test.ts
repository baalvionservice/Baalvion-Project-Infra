/**
 * @file server/search/__tests__/document.test.ts
 * @description PROMPT 8 — unit tests for the pure GCKB-record → SearchDocument
 * projection: lifting Country / Price / Category out of promoted columns and the
 * `attributes` JSON, building the keyword haystack, and the precedence rules.
 */
import { describe, it, expect } from 'vitest';
import { GckbRecord } from '@prisma/client';
import { projectRecord } from '../document';

function rec(partial: Partial<GckbRecord>): GckbRecord {
  return {
    id: 'rec-1',
    organizationId: 'org-1',
    entityType: 'product',
    recordKey: 'SKU-1',
    name: 'Basmati Rice 5kg',
    countryId: null,
    parentId: null,
    code: 'SKU-1',
    policyType: null,
    hsCode: '100630',
    productCategory: null,
    attributes: {},
    tags: ['rice', 'staple'],
    version: 1,
    status: 'PUBLISHED',
    effectiveFrom: null,
    effectiveTo: null,
    publishedAt: null,
    authority: null,
    source: null,
    checksum: 'x',
    auditReference: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    deletedAt: null,
    ...partial,
  } as GckbRecord;
}

describe('projectRecord', () => {
  it('extracts country, price, currency and category from attributes', () => {
    const doc = projectRecord(
      rec({
        attributes: {
          originCountryCode: 'in',
          categoryKey: 'grains',
          brand: 'Royal',
          description: 'Long grain aromatic rice',
          commercialTerms: { unitPrice: 25.5, currency: 'usd' },
        },
      }),
    );
    expect(doc.country).toBe('IN'); // uppercased
    expect(doc.category).toBe('grains');
    expect(doc.price).toBe(25.5);
    expect(doc.currency).toBe('USD');
    expect(doc.brand).toBe('Royal');
    expect(doc.description).toBe('Long grain aromatic rice');
  });

  it('prefers the promoted productCategory column over attributes', () => {
    const doc = projectRecord(rec({ productCategory: 'cereals', attributes: { categoryKey: 'grains' } }));
    expect(doc.category).toBe('cereals');
  });

  it('falls back through the price precedence chain', () => {
    expect(projectRecord(rec({ attributes: { tradeMetadata: { indicativeUnitPrice: 12, currency: 'EUR' } } })).price).toBe(12);
    expect(projectRecord(rec({ attributes: { price: { amount: 7, currency: 'GBP' } } })).price).toBe(7);
    expect(projectRecord(rec({ attributes: {} })).price).toBeNull();
  });

  it('accepts numeric strings for price', () => {
    expect(projectRecord(rec({ attributes: { commercialTerms: { unitPrice: '99.99' } } })).price).toBeCloseTo(99.99);
  });

  it('picks the first media url as the image', () => {
    const doc = projectRecord(
      rec({ attributes: { media: [{ url: 'https://cdn/x.jpg', type: 'IMAGE' }, { url: 'https://cdn/y.jpg' }] } }),
    );
    expect(doc.imageUrl).toBe('https://cdn/x.jpg');
  });

  it('builds a lower-cased haystack covering name, tags, country and description', () => {
    const doc = projectRecord(
      rec({ name: 'Jasmine Rice', tags: ['Aromatic'], attributes: { originCountryCode: 'TH', description: 'Fragrant' } }),
    );
    expect(doc.searchText).toContain('jasmine rice');
    expect(doc.searchText).toContain('aromatic');
    expect(doc.searchText).toContain('th');
    expect(doc.searchText).toContain('fragrant');
  });

  it('is null-safe on empty attributes', () => {
    const doc = projectRecord(rec({ attributes: {}, productCategory: null, hsCode: null }));
    expect(doc.country).toBeNull();
    expect(doc.price).toBeNull();
    expect(doc.category).toBeNull();
    expect(doc.imageUrl).toBeNull();
  });
});
