import { describe, it, expect, vi } from 'vitest';
import { onMissingCheckoutDependency, revalidateCartStock } from './checkout-policy';

describe('onMissingCheckoutDependency', () => {
  it('allows checkout to proceed in CONTINUITY mode (the current default)', () => {
    const decision = onMissingCheckoutDependency('inventoryLock');
    expect(decision.proceed).toBe(true);
  });
});

describe('revalidateCartStock', () => {
  it('flags a line as sold out when the catalog explicitly reports inStock: false', async () => {
    const fetchAvailability = vi.fn().mockResolvedValue({ inStock: false });
    const result = await revalidateCartStock(
      [{ productId: 'p1', name: 'Vintage Clutch' }],
      fetchAvailability,
    );
    expect(result.available).toBe(false);
    expect(result.soldOut).toEqual(['Vintage Clutch']);
  });

  it('flags a tracked line as sold out when stock is zero and inStock is not explicitly true', async () => {
    const fetchAvailability = vi.fn().mockResolvedValue({ stock: 0 });
    const result = await revalidateCartStock(
      [{ productId: 'p1', name: 'Archive Brooch' }],
      fetchAvailability,
    );
    expect(result.available).toBe(false);
    expect(result.soldOut).toEqual(['Archive Brooch']);
  });

  it('does not flag a line when stock is zero but inStock is explicitly true (e.g. made-to-order)', async () => {
    const fetchAvailability = vi.fn().mockResolvedValue({ stock: 0, inStock: true });
    const result = await revalidateCartStock(
      [{ productId: 'p1', name: 'Bespoke Order' }],
      fetchAvailability,
    );
    expect(result.available).toBe(true);
    expect(result.soldOut).toEqual([]);
  });

  it('does not block checkout when a product cannot be resolved (fail-open, not a false negative)', async () => {
    const fetchAvailability = vi.fn().mockResolvedValue(null);
    const result = await revalidateCartStock(
      [{ productId: 'unknown', name: 'Missing Item' }],
      fetchAvailability,
    );
    expect(result.available).toBe(true);
  });

  it('fails open when the availability fetch throws, so a transient API blip never blocks a sale', async () => {
    const fetchAvailability = vi.fn().mockRejectedValue(new Error('network error'));
    const result = await revalidateCartStock(
      [{ productId: 'p1', name: 'Heirloom Ring' }],
      fetchAvailability,
    );
    expect(result.available).toBe(true);
    expect(result.soldOut).toEqual([]);
  });

  it('checks every line independently and reports all sold-out items', async () => {
    const fetchAvailability = vi.fn((productId: string) =>
      Promise.resolve(productId === 'sold-out' ? { inStock: false } : { inStock: true }),
    );
    const result = await revalidateCartStock(
      [
        { productId: 'sold-out', name: 'Item A' },
        { productId: 'in-stock', name: 'Item B' },
      ],
      fetchAvailability,
    );
    expect(result.available).toBe(false);
    expect(result.soldOut).toEqual(['Item A']);
  });

  it('skips lines with no productId (nothing to re-check)', async () => {
    const fetchAvailability = vi.fn();
    const result = await revalidateCartStock([{ productId: '', name: 'Gift Wrap' }], fetchAvailability);
    expect(fetchAvailability).not.toHaveBeenCalled();
    expect(result.available).toBe(true);
  });
});
