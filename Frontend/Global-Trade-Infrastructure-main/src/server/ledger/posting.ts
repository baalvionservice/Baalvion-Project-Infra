/**
 * @file server/ledger/posting.ts
 * @description The double-entry posting validator — the single guarantee the
 * whole ledger rests on. A posting is accepted only if every leg is a positive
 * amount in one shared currency and the sum of the debit legs exactly equals the
 * sum of the credit legs. Because money is exact integer arithmetic (see
 * money.ts), "balanced" is a precise `===`, never an epsilon comparison.
 *
 * Pure and Prisma-free: the service layer calls `buildPosting` to obtain a
 * `BalancedPosting`, then persists it atomically.
 */
import { Money } from './money';
import {
  AccountDelta,
  BalancedPosting,
  EntryDirection,
  NormalSide,
  PostingLine,
} from './types';

export type { PostingLine };

export class PostingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PostingError';
  }
}

/**
 * Validate and normalise a set of posting legs into a `BalancedPosting`.
 * Throws {@link PostingError} on any violation of the double-entry rules.
 */
export function buildPosting(lines: readonly PostingLine[]): BalancedPosting {
  if (lines.length < 2) {
    throw new PostingError('UNBALANCED: a posting needs at least two legs');
  }

  const currency = lines[0].amount.currency;
  let debit = Money.zero(currency);
  let credit = Money.zero(currency);
  const seen = new Map<string, EntryDirection>();

  for (const line of lines) {
    if (line.amount.currency !== currency) {
      throw new PostingError(
        `MIXED_CURRENCY: ${line.amount.currency} in a ${currency} posting (use a paired FX posting instead)`,
      );
    }
    if (!line.amount.isPositive()) {
      throw new PostingError('NON_POSITIVE_LEG: each leg must be a positive amount');
    }
    // Guard the classic data-entry mistake of debiting AND crediting the same
    // account in one posting, which nets to nothing but pollutes the audit trail.
    const prior = seen.get(line.accountId);
    if (prior && prior !== line.direction) {
      throw new PostingError(`SELF_OFFSET: account ${line.accountId} is both debited and credited`);
    }
    seen.set(line.accountId, line.direction);

    if (line.direction === 'DEBIT') debit = debit.add(line.amount);
    else credit = credit.add(line.amount);
  }

  if (!debit.equals(credit)) {
    throw new PostingError(
      `UNBALANCED: debits ${debit.toDecimalString()} ≠ credits ${credit.toDecimalString()} ${currency}`,
    );
  }

  return { currency, lines: [...lines], total: debit };
}

/**
 * Collapse a balanced posting into one signed delta per account, expressed in
 * each account's NORMAL direction (positive = balance increases). The caller
 * supplies how to resolve an account's normal side. Used to update stored
 * balances atomically without re-deriving them from the full entry history.
 */
export function deltasFor(
  posting: BalancedPosting,
  normalSideOf: (accountId: string) => NormalSide,
): AccountDelta[] {
  const byAccount = new Map<string, Money>();
  for (const line of posting.lines) {
    const normal = normalSideOf(line.accountId);
    const signed = line.direction === normal ? line.amount : line.amount.negate();
    const current = byAccount.get(line.accountId);
    byAccount.set(line.accountId, current ? current.add(signed) : signed);
  }
  return [...byAccount.entries()].map(([accountId, delta]) => ({ accountId, delta }));
}

/** Convenience constructor for a simple two-leg transfer (move money A → B). */
export function transfer(
  fromAccountId: string,
  toAccountId: string,
  amount: Money,
  memo?: string,
): PostingLine[] {
  if (fromAccountId === toAccountId) {
    throw new PostingError('SELF_TRANSFER: source and destination accounts are identical');
  }
  return [
    { accountId: toAccountId, direction: 'DEBIT', amount, memo },
    { accountId: fromAccountId, direction: 'CREDIT', amount, memo },
  ];
}
