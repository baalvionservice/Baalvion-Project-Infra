/**
 * @file server/gckb/__tests__/checksum.test.ts
 * @description Unit tests for the deterministic content checksum. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { canonicalize, checksum, recordChecksum } from '../checksum';

describe('canonicalize', () => {
  it('sorts object keys recursively but preserves array order', () => {
    expect(canonicalize({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
    expect(canonicalize([3, 1, 2])).toBe('[3,1,2]');
  });
});

describe('checksum', () => {
  it('is stable regardless of key order', () => {
    expect(checksum({ a: 1, b: 2 })).toBe(checksum({ b: 2, a: 1 }));
  });
  it('changes when content changes', () => {
    expect(checksum({ a: 1 })).not.toBe(checksum({ a: 2 }));
  });
});

describe('recordChecksum', () => {
  const base = {
    entityType: 'country_policy',
    recordKey: 'US:tax:vat',
    name: 'VAT',
    attributes: { ratePercent: 20, taxType: 'VAT' },
    policyType: 'tax',
    countryCode: 'US',
  };

  it('is order-independent in attributes and tags', () => {
    const a = recordChecksum({ ...base, attributes: { taxType: 'VAT', ratePercent: 20 }, tags: ['x', 'y'] });
    const b = recordChecksum({ ...base, attributes: { ratePercent: 20, taxType: 'VAT' }, tags: ['y', 'x'] });
    expect(a).toBe(b);
  });

  it('differs when a meaningful field changes', () => {
    const a = recordChecksum(base);
    const b = recordChecksum({ ...base, attributes: { ratePercent: 18, taxType: 'VAT' } });
    expect(a).not.toBe(b);
  });
});
