/**
 * @file server/ledger/__tests__/money.test.ts
 * @description Unit tests for exact money arithmetic. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money, MoneyError, assertCurrency, isSupportedCurrency } from '../money';

describe('Money.of — parsing & precision', () => {
  it('parses major + minor units exactly', () => {
    expect(Money.of('100.50', 'USD').units).toBe(BigInt(1_005_000));
    expect(Money.of('100', 'USD').units).toBe(BigInt(1_000_000));
    expect(Money.of(0, 'USD').units).toBe(BigInt(0));
    expect(Money.of('100.99', 'USD').units).toBe(BigInt(1_009_900)); // cent → scale-4 units
  });

  it('round-trips to a fixed scale-4 decimal string', () => {
    expect(Money.of('100.5', 'USD').toDecimalString()).toBe('100.5000');
    expect(Money.of('-7.25', 'EUR').toDecimalString()).toBe('-7.2500');
    expect(Money.of('1000000', 'JPY').toDecimalString()).toBe('1000000.0000');
  });

  it('rejects precision finer than the currency allows', () => {
    expect(() => Money.of('100.005', 'USD')).toThrow(MoneyError); // USD = 2 dp
    expect(() => Money.of('100.5', 'JPY')).toThrow(MoneyError); // JPY = 0 dp
    expect(Money.of('100.99', 'USD').toDecimalString()).toBe('100.9900');
  });

  it('rejects malformed amounts and unsupported currencies', () => {
    expect(() => Money.of('abc', 'USD')).toThrow(MoneyError);
    expect(() => Money.of('1.2.3', 'USD')).toThrow(MoneyError);
    expect(() => Money.of('100', 'XYZ')).toThrow(MoneyError);
  });
});

describe('Money — arithmetic & comparison', () => {
  it('adds and subtracts exactly with no float drift', () => {
    let sum = Money.zero('USD');
    for (let i = 0; i < 10; i += 1) sum = sum.add(Money.of('0.10', 'USD'));
    expect(sum.toDecimalString()).toBe('1.0000'); // 0.1 × 10 — the classic float trap
  });

  it('compares and reports sign', () => {
    const a = Money.of('100', 'USD');
    const b = Money.of('250', 'USD');
    expect(a.lt(b)).toBe(true);
    expect(b.gt(a)).toBe(true);
    expect(a.compare(a)).toBe(0);
    expect(b.subtract(a).toDecimalString()).toBe('150.0000');
    expect(a.subtract(b).isNegative()).toBe(true);
  });

  it('refuses cross-currency operations', () => {
    expect(() => Money.of('1', 'USD').add(Money.of('1', 'EUR'))).toThrow(MoneyError);
    expect(() => Money.of('1', 'USD').compare(Money.of('1', 'GBP'))).toThrow(MoneyError);
    expect(Money.of('1', 'USD').equals(Money.of('1', 'EUR'))).toBe(false);
  });

  it('reconstructs from trusted DB units', () => {
    const m = Money.fromUnits(BigInt(1_005_000), 'USD');
    expect(m.toDecimalString()).toBe('100.5000');
  });
});

describe('currency registry', () => {
  it('knows supported currencies and normalises case', () => {
    expect(isSupportedCurrency('USD')).toBe(true);
    expect(isSupportedCurrency('xyz')).toBe(false);
    expect(assertCurrency('usd')).toBe('USD');
    expect(() => assertCurrency('ZZZ')).toThrow();
  });
});
