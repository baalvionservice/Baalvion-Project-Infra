/**
 * @file server/treasury/__tests__/fee-math.test.ts
 * @description Unit tests for pure fee calculation. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../../ledger/money';
import { computeFee, FeeError } from '../fees/fee-math';
import { FeeRuleDefinition } from '../types';

const usd = (v: string) => Money.of(v, 'USD');

describe('computeFee', () => {
  it('FLAT', () => {
    const rule: FeeRuleDefinition = { type: 'FLAT', currency: 'USD', flatAmount: '2.50' };
    expect(computeFee(rule, usd('1000.00')).toDecimalString()).toBe('2.5000');
  });

  it('PERCENTAGE (basis points)', () => {
    const rule: FeeRuleDefinition = { type: 'PERCENTAGE', currency: 'USD', basisPoints: 50 }; // 0.5%
    expect(computeFee(rule, usd('1000.00')).toDecimalString()).toBe('5.0000');
  });

  it('PERCENTAGE with min/max clamp', () => {
    const rule: FeeRuleDefinition = { type: 'PERCENTAGE', currency: 'USD', basisPoints: 10, minFee: '1.00', maxFee: '50.00' };
    expect(computeFee(rule, usd('100.00')).toDecimalString()).toBe('1.0000'); // 0.10 → min 1.00
    expect(computeFee(rule, usd('1000000.00')).toDecimalString()).toBe('50.0000'); // → max 50
  });

  it('TIER selects the covering band (whole-amount pricing)', () => {
    const rule: FeeRuleDefinition = {
      type: 'TIER',
      currency: 'USD',
      tiers: [
        { upToAmount: '1000.00', basisPoints: 100 }, // ≤1k → 1%
        { upToAmount: '10000.00', basisPoints: 50 }, // ≤10k → 0.5%
        { upToAmount: null, basisPoints: 25 }, // >10k → 0.25%
      ],
    };
    expect(computeFee(rule, usd('500.00')).toDecimalString()).toBe('5.0000'); // 1%
    expect(computeFee(rule, usd('5000.00')).toDecimalString()).toBe('25.0000'); // 0.5%
    expect(computeFee(rule, usd('100000.00')).toDecimalString()).toBe('250.0000'); // 0.25%
  });

  it('rejects currency mismatch and malformed rules', () => {
    expect(() => computeFee({ type: 'FLAT', currency: 'EUR', flatAmount: '1' }, usd('10'))).toThrow(/CURRENCY_MISMATCH/);
    expect(() => computeFee({ type: 'PERCENTAGE', currency: 'USD' }, usd('10'))).toThrow(FeeError);
  });
});
