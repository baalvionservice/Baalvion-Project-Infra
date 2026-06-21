/**
 * @file server/treasury/__tests__/money-math.test.ts
 * @description Unit tests for exact rate / basis-point arithmetic. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money, MoneyError } from '../../ledger/money';
import { applyRate, bpsOf, parseRate, formatRate, roundDivHalfUp, roundUnitsToCurrency } from '../money-math';

describe('roundDivHalfUp', () => {
  it('rounds halves up', () => {
    expect(roundDivHalfUp(BigInt(5), BigInt(2))).toBe(BigInt(3)); // 2.5 → 3
    expect(roundDivHalfUp(BigInt(4), BigInt(2))).toBe(BigInt(2));
    expect(roundDivHalfUp(BigInt(7), BigInt(3))).toBe(BigInt(2)); // 2.33 → 2
    expect(roundDivHalfUp(BigInt(8), BigInt(3))).toBe(BigInt(3)); // 2.67 → 3
  });
});

describe('parseRate / formatRate', () => {
  it('round-trips a scale-8 rate', () => {
    expect(formatRate(parseRate('1.2345'))).toBe('1.23450000');
    expect(formatRate(parseRate('83.91234567'))).toBe('83.91234567');
    expect(parseRate('1')).toBe(BigInt(100_000_000));
  });
  it('rejects malformed or over-precise rates', () => {
    expect(() => parseRate('1.234567891')).toThrow(MoneyError); // 9 dp
    expect(() => parseRate('abc')).toThrow(MoneyError);
  });
});

describe('applyRate — exact conversion with currency rounding', () => {
  it('converts USD → INR and rounds to 2dp', () => {
    // 100.00 USD × 83.50 = 8350.00 INR
    expect(applyRate(Money.of('100.00', 'USD'), '83.50', 'INR').toDecimalString()).toBe('8350.0000');
  });
  it('rounds to JPY (0 dp)', () => {
    // 10.00 USD × 150.357 = 1503.57 → JPY rounds to 1504
    expect(applyRate(Money.of('10.00', 'USD'), '150.357', 'JPY').toDecimalString()).toBe('1504.0000');
  });
  it('rounds sub-cent products half-up to the quote currency', () => {
    // 1.00 × 1.005 = 1.005 → USD (2dp) → 1.01 (half up)
    expect(applyRate(Money.of('1.00', 'USD'), '1.005', 'EUR').toDecimalString()).toBe('1.0100');
  });
});

describe('bpsOf — basis points', () => {
  it('computes 25 bps of 1,000.00', () => {
    expect(bpsOf(Money.of('1000.00', 'USD'), 25).toDecimalString()).toBe('2.5000');
  });
  it('rounds to currency precision', () => {
    // 33 bps of 10.00 = 0.033 → USD 2dp → 0.03
    expect(bpsOf(Money.of('10.00', 'USD'), 33).toDecimalString()).toBe('0.0300');
  });
  it('rejects negative bps', () => {
    expect(() => bpsOf(Money.of('1', 'USD'), -5)).toThrow(MoneyError);
  });
});

describe('roundUnitsToCurrency', () => {
  it('floors scale-4 to currency precision with half-up', () => {
    expect(roundUnitsToCurrency(BigInt(10_050), 'USD')).toBe(BigInt(10_100)); // 1.0050 → 1.01
    expect(roundUnitsToCurrency(BigInt(10_049), 'USD')).toBe(BigInt(10_000)); // 1.0049 → 1.00
    expect(roundUnitsToCurrency(BigInt(15_000), 'JPY')).toBe(BigInt(20_000)); // 1.5 → 2
  });
});
