/**
 * @file server/ledger/__tests__/settlement-machine.test.ts
 * @description Unit tests for the settlement state machine and its implied
 * money-custody postings. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { Money } from '../money';
import { buildPosting } from '../posting';
import {
  planTransition,
  legalActions,
  isLegalAction,
  SettlementError,
  SettlementAccounts,
  SettlementAmounts,
} from '../settlement-machine';

const accounts: SettlementAccounts = {
  payerAccountId: 'payer',
  clearingAccountId: 'clearing',
  payeeAccountId: 'payee',
};
const usd = (v: string) => Money.of(v, 'USD');
const amounts = (amount: string, settled = '0'): SettlementAmounts => ({
  amount: usd(amount),
  settled: usd(settled),
});

describe('legality', () => {
  it('exposes legal actions per state', () => {
    expect(legalActions('CREATED').sort()).toEqual(['AUTHORIZE', 'CANCEL', 'FAIL']);
    expect(legalActions('CAPTURED').sort()).toEqual(['FAIL', 'SETTLE']);
    expect(legalActions('SETTLED')).toEqual(['REVERSE']);
    expect(legalActions('FAILED')).toEqual([]);
  });

  it('rejects illegal transitions', () => {
    expect(isLegalAction('CREATED', 'SETTLE')).toBe(false);
    expect(() => planTransition('CREATED', 'SETTLE', accounts, amounts('100'))).toThrow(SettlementError);
    expect(() => planTransition('SETTLED', 'AUTHORIZE', accounts, amounts('100'))).toThrow(/ILLEGAL_TRANSITION/);
  });
});

describe('custody postings stay balanced', () => {
  it('AUTHORIZE reserves payer → clearing', () => {
    const plan = planTransition('CREATED', 'AUTHORIZE', accounts, amounts('100'));
    expect(plan.toStatus).toBe('AUTHORIZED');
    const posting = buildPosting(plan.posting!);
    expect(posting.total.toDecimalString()).toBe('100.0000');
    expect(plan.posting!.find((l) => l.accountId === 'clearing')?.direction).toBe('DEBIT');
    expect(plan.posting!.find((l) => l.accountId === 'payer')?.direction).toBe('CREDIT');
  });

  it('CAPTURE moves no money', () => {
    const plan = planTransition('AUTHORIZED', 'CAPTURE', accounts, amounts('100'));
    expect(plan.toStatus).toBe('CAPTURED');
    expect(plan.posting).toBeNull();
    expect(plan.movedAmount.isZero()).toBe(true);
  });

  it('SETTLE in full moves clearing → payee and reaches SETTLED', () => {
    const plan = planTransition('CAPTURED', 'SETTLE', accounts, amounts('100'));
    expect(plan.toStatus).toBe('SETTLED');
    expect(plan.settledAfter.toDecimalString()).toBe('100.0000');
    const posting = buildPosting(plan.posting!);
    expect(posting.total.toDecimalString()).toBe('100.0000');
  });

  it('supports partial settlement bookkeeping', () => {
    const first = planTransition('CAPTURED', 'SETTLE', accounts, amounts('100'), usd('40'));
    expect(first.toStatus).toBe('PARTIALLY_SETTLED');
    expect(first.settledAfter.toDecimalString()).toBe('40.0000');

    const second = planTransition('PARTIALLY_SETTLED', 'SETTLE', accounts, amounts('100', '40'), usd('60'));
    expect(second.toStatus).toBe('SETTLED');
    expect(second.settledAfter.toDecimalString()).toBe('100.0000');
  });

  it('rejects over-settlement beyond the remaining amount', () => {
    expect(() => planTransition('CAPTURED', 'SETTLE', accounts, amounts('100', '80'), usd('40'))).toThrow(
      /OVER_SETTLEMENT/,
    );
  });

  it('FAIL releases the still-held remainder back to the payer', () => {
    const plan = planTransition('PARTIALLY_SETTLED', 'FAIL', accounts, amounts('100', '40'));
    expect(plan.toStatus).toBe('FAILED');
    const posting = buildPosting(plan.posting!);
    expect(posting.total.toDecimalString()).toBe('60.0000'); // 100 - 40 still in clearing
    expect(plan.posting!.find((l) => l.accountId === 'payer')?.direction).toBe('DEBIT');
  });

  it('FAIL from CREATED moves nothing (nothing was ever held)', () => {
    const plan = planTransition('CREATED', 'FAIL', accounts, amounts('100'));
    expect(plan.toStatus).toBe('FAILED');
    expect(plan.posting).toBeNull();
  });

  it('REVERSE refunds payee → payer after settlement', () => {
    const plan = planTransition('SETTLED', 'REVERSE', accounts, amounts('100', '100'));
    expect(plan.toStatus).toBe('REVERSED');
    const posting = buildPosting(plan.posting!);
    expect(posting.total.toDecimalString()).toBe('100.0000');
    expect(plan.posting!.find((l) => l.accountId === 'payer')?.direction).toBe('DEBIT');
  });
});
