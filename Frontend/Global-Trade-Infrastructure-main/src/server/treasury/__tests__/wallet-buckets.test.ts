/**
 * @file server/treasury/__tests__/wallet-buckets.test.ts
 * @description Unit tests for the wallet-operation posting builders. Every
 * operation must yield a balanced posting. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../../ledger/money';
import { buildPosting } from '../../ledger/posting';
import { walletOpPosting, requiresCounterAccount, WalletOpError, WalletAccounts } from '../wallets/wallet-buckets';
import { WALLET_OPS } from '../types';

const accounts: WalletAccounts = { available: 'av', held: 'hl', reserved: 'rs', pending: 'pd' };
const amt = Money.of('100.00', 'USD');

describe('walletOpPosting', () => {
  it('produces a balanced posting for every operation', () => {
    for (const op of WALLET_OPS) {
      const counter = requiresCounterAccount(op) ? 'external' : undefined;
      const lines = walletOpPosting(op, accounts, amt, counter);
      expect(() => buildPosting(lines)).not.toThrow();
      expect(buildPosting(lines).total.toDecimalString()).toBe('100.0000');
    }
  });

  it('HOLD moves available → held', () => {
    const lines = walletOpPosting('HOLD', accounts, amt);
    expect(lines.find((l) => l.accountId === 'hl')?.direction).toBe('DEBIT'); // held increases
    expect(lines.find((l) => l.accountId === 'av')?.direction).toBe('CREDIT'); // available decreases
  });

  it('CREDIT moves counter → available', () => {
    const lines = walletOpPosting('CREDIT', accounts, amt, 'external');
    expect(lines.find((l) => l.accountId === 'av')?.direction).toBe('DEBIT');
    expect(lines.find((l) => l.accountId === 'external')?.direction).toBe('CREDIT');
  });

  it('requires a counter account for boundary ops', () => {
    expect(requiresCounterAccount('CREDIT')).toBe(true);
    expect(requiresCounterAccount('HOLD')).toBe(false);
    expect(() => walletOpPosting('DEBIT', accounts, amt)).toThrow(/COUNTER_REQUIRED/);
    expect(() => walletOpPosting('HOLD', accounts, Money.of('0', 'USD'))).toThrow(WalletOpError);
  });
});
