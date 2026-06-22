/**
 * @file server/treasury/__tests__/wallet-balances.test.ts
 * @description Unit tests for pure wallet-balance derivation. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../../ledger/money';
import { deriveWalletBalances, balancesToStrings, BalanceError } from '../balances/wallet-balances';
import { BucketBalances, WalletFlows } from '../types';

const usd = (v: string) => Money.of(v, 'USD');

function buckets(available: string, held: string, reserved: string, pending: string): BucketBalances {
  return { available: usd(available), held: usd(held), reserved: usd(reserved), pending: usd(pending) };
}

describe('deriveWalletBalances', () => {
  it('computes total and projected, and validates pending = incoming − outgoing', () => {
    const flows: WalletFlows = { incoming: usd('300.00'), outgoing: usd('100.00') };
    const b = deriveWalletBalances(buckets('500.00', '150.00', '50.00', '200.00'), flows);
    expect(b.total.toDecimalString()).toBe('900.0000'); // 500+150+50+200
    expect(b.projected.toDecimalString()).toBe('700.0000'); // 500 + 200
    expect(b.pending.toDecimalString()).toBe('200.0000');
  });

  it('serialises to decimal strings', () => {
    const flows: WalletFlows = { incoming: usd('0'), outgoing: usd('0') };
    const s = balancesToStrings(deriveWalletBalances(buckets('10.00', '0', '0', '0'), flows));
    expect(s.available).toBe('10.0000');
    expect(s.total).toBe('10.0000');
    expect(s.currency).toBe('USD');
  });

  it('throws when pending bucket disagrees with the flows', () => {
    const flows: WalletFlows = { incoming: usd('300.00'), outgoing: usd('100.00') }; // net 200
    expect(() => deriveWalletBalances(buckets('0', '0', '0', '199.00'), flows)).toThrow(/PENDING_FLOW_MISMATCH/);
  });

  it('rejects mixed currencies', () => {
    const mixed: BucketBalances = {
      available: usd('1'),
      held: Money.of('1', 'EUR'),
      reserved: usd('0'),
      pending: usd('0'),
    };
    expect(() => deriveWalletBalances(mixed, { incoming: usd('0'), outgoing: usd('0') })).toThrow(BalanceError);
  });
});
