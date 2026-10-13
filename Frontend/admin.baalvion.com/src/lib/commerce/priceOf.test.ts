import { describe, it, expect } from 'vitest';
import { priceOf } from './priceOf';
import type { Product } from '@/lib/types/commerce.types';

const p = (customFields: Record<string, unknown> | undefined, variants: Array<{ price: number; isDefault: boolean }> | undefined) =>
  ({ customFields, variants } as unknown as Product);

describe('priceOf', () => {
  it('prefers the product price field', () => { expect(priceOf(p({ basePrice: 4500 }, [{ price: 1, isDefault: true }]))).toBe(4500); });
  it('falls back to the main variant — how your 5 live products are priced', () => {
    expect(priceOf(p({}, [{ price: 24500, isDefault: true }]))).toBe(24500);
    expect(priceOf(p(undefined, [{ price: 9, isDefault: false }, { price: 15000, isDefault: true }]))).toBe(15000);
  });
  it('is null when there is no usable price', () => {
    expect(priceOf(p({}, []))).toBeNull();
    expect(priceOf(p({ basePrice: '' }, undefined))).toBeNull();
    expect(priceOf(p({ basePrice: 'abc' }, undefined))).toBeNull();
  });
});
