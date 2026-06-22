/**
 * @file server/treasury/__tests__/fx-math.test.ts
 * @description Unit tests for pure FX pricing / conversion / expiry. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../../ledger/money';
import { priceQuote, convert, isExpired, marginAmount, FXError } from '../fx/fx-math';

describe('priceQuote', () => {
  it('marks the mid rate down by spread + margin', () => {
    // mid 1.00000000, 50 bps spread + 50 bps margin = 100 bps → all-in 0.99000000
    const p = priceQuote('1.00', 50, 50);
    expect(p.allInRate).toBe('0.99000000');
    expect(p.midRate).toBe('1.00000000');
  });

  it('prices a realistic USD→INR quote', () => {
    // mid 83.50, 20 bps total → 83.50 × 0.9980 = 83.333000
    const p = priceQuote('83.50', 10, 10);
    expect(p.allInRate).toBe('83.33300000');
  });

  it('rejects negative bps or a spread ≥ 100%', () => {
    expect(() => priceQuote('1.00', -1, 0)).toThrow(FXError);
    expect(() => priceQuote('1.00', 9000, 1000)).toThrow(/SPREAD_TOO_WIDE/);
  });
});

describe('convert', () => {
  it('applies the all-in rate to a base amount', () => {
    const out = convert(Money.of('100.00', 'USD'), '83.33300000', 'INR');
    expect(out.currency).toBe('INR');
    expect(out.toDecimalString()).toBe('8333.3000');
  });
  it('rejects non-positive base', () => {
    expect(() => convert(Money.of('0', 'USD'), '1.0', 'EUR')).toThrow(FXError);
  });
});

describe('marginAmount', () => {
  it('is the difference between mid and all-in conversion', () => {
    // 1000 USD: mid 83.50 → 83500 INR; all-in 83.333 → 83333 INR; margin 167 INR
    const m = marginAmount(Money.of('1000.00', 'USD'), '83.50', '83.333', 'INR');
    expect(m.toDecimalString()).toBe('167.0000');
  });
});

describe('isExpired', () => {
  it('is true at or after expiry', () => {
    expect(isExpired(1000, 1000)).toBe(true);
    expect(isExpired(1001, 1000)).toBe(true);
    expect(isExpired(999, 1000)).toBe(false);
  });
});
