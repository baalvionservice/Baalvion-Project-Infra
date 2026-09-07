/**
 * Splitting a multi-line entry into two-legged postings.
 *
 * Proper double-entry has as many legs as the transaction needs: a captured payment has three —
 * money received, the fee the processor kept, and the obligation created. The platform's Java
 * `ledger-service` stores one debit account, one credit account and one amount per row, so it
 * cannot hold a three-legged entry directly.
 *
 * Rather than change a ledger that already works (and that this codebase cannot compile or test
 * here), the entry is split into balanced pairs. This is the standard treatment for a two-legged
 * store, and it is lossless in the way that matters:
 *
 *   - every pair balances on its own
 *   - the pairs together sum to the original total
 *   - each account's net movement is exactly what the multi-line entry said
 *
 * The pairs share the original `transactionRef` with a suffix, so they remain identifiable as
 * one economic event and re-posting stays idempotent.
 */
import { Money } from '@baalvion/money';
import { LedgerError, assertBalanced, type JournalEntry, type JournalLine } from './postings';
import type { AccountKey } from './accounts';

export interface TwoLeggedPosting {
  transactionRef: string;
  debitAccount: AccountKey;
  debitAccountCode: string;
  creditAccount: AccountKey;
  creditAccountCode: string;
  amount: Money;
  currency: string;
  entryType: JournalEntry['entryType'];
  occurredAt: string;
  legalEntityId: string | null;
  siteId: string;
  tenantId: string | null;
  partyId: string | null;
  memo: string;
}

interface Leg {
  line: JournalLine;
  remaining: Money;
}

/**
 * Split one balanced entry into balanced two-legged postings.
 *
 * Greedy matching: take the smaller of the current debit and credit remainders, emit that pair,
 * and move on. A three-leg entry becomes two postings; a two-leg entry passes through as one.
 */
export function toTwoLeggedPostings(entry: JournalEntry): TwoLeggedPosting[] {
  assertBalanced(entry);
  const zero = Money.zero(entry.currency);

  const debits: Leg[] = entry.lines.filter((l) => l.side === 'DEBIT').map((line) => ({ line, remaining: line.amount }));
  const credits: Leg[] = entry.lines.filter((l) => l.side === 'CREDIT').map((line) => ({ line, remaining: line.amount }));

  if (debits.length === 0 || credits.length === 0) {
    throw new LedgerError('UNBALANCED', `Entry ${entry.transactionRef} has no ${debits.length === 0 ? 'debit' : 'credit'} side`, { ref: entry.transactionRef });
  }

  const out: TwoLeggedPosting[] = [];
  let d = 0;
  let c = 0;

  while (d < debits.length && c < credits.length) {
    const debit = debits[d]!;
    const credit = credits[c]!;
    if (debit.remaining.isZero()) { d += 1; continue; }
    if (credit.remaining.isZero()) { c += 1; continue; }

    const amount = debit.remaining.lessThan(credit.remaining) ? debit.remaining : credit.remaining;
    out.push({
      // Suffixed so the pairs stay recognisable as one event, and so re-posting the same
      // economic event is still idempotent in a store that keys on the reference.
      transactionRef: `${entry.transactionRef}#${out.length + 1}`,
      debitAccount: debit.line.account,
      debitAccountCode: debit.line.accountCode,
      creditAccount: credit.line.account,
      creditAccountCode: credit.line.accountCode,
      amount,
      currency: entry.currency,
      entryType: entry.entryType,
      occurredAt: entry.occurredAt,
      legalEntityId: entry.legalEntityId ?? null,
      siteId: entry.siteId,
      tenantId: entry.tenantId ?? null,
      partyId: entry.partyId ?? null,
      memo: `${debit.line.memo} / ${credit.line.memo}`,
    });

    debit.remaining = debit.remaining.subtract(amount);
    credit.remaining = credit.remaining.subtract(amount);
  }

  // Both sides must be exhausted. If they are not, the split lost money — which cannot happen
  // for a balanced entry, so it is asserted rather than assumed.
  const leftDebit = debits.reduce((s, l) => s.add(l.remaining), zero);
  const leftCredit = credits.reduce((s, l) => s.add(l.remaining), zero);
  if (!leftDebit.isZero() || !leftCredit.isZero()) {
    throw new LedgerError(
      'UNBALANCED',
      `Splitting ${entry.transactionRef} left ${leftDebit.toDecimalString()} debit and ${leftCredit.toDecimalString()} credit unallocated`,
      { ref: entry.transactionRef },
    );
  }
  return out;
}

/**
 * The payload the Java ledger-service's POST /entries accepts.
 *
 * This is written against that service's ACTUAL contract, which was read from its DTO and
 * entity rather than assumed:
 *
 *   - `amount` is a major-unit decimal (`BigDecimal`, precision 19 / scale 4), NOT minor units.
 *     Its `@DecimalMin("0.01")` and four decimal places only make sense for a decimal amount,
 *     and its own tests post `new BigDecimal("150.0000")`. Sending minor units here overstates
 *     every entry by 10^exponent.
 *   - `metadata` is a `String` holding JSON, not a JSON object. Jackson will not bind an object
 *     into a String field, so an object here is a 400 on every single posting.
 *   - `transactionRef` is capped at 64 characters in both the DTO and the column, and it is the
 *     idempotency key. It is never silently truncated: two different postings truncated to the
 *     same ref would dedup against each other and one would vanish. Too long is a permanent,
 *     loud failure.
 *   - `entryType` goes through `EntryType.valueOf()`, so anything outside the enum is a 500.
 *
 * Account ids there are per-tenant UUIDs, so the caller supplies the mapping — this package
 * knows accounting, not that service's account registry.
 */
const LEDGER_ENTRY_TYPES = new Set(['PAYMENT', 'FEE', 'REVERSAL', 'SETTLEMENT', 'ESCROW', 'REFUND', 'ADJUSTMENT']);

/** The smallest amount the ledger's `@DecimalMin` will accept, in major units. */
const LEDGER_MIN_AMOUNT_MINOR_UNITS = (exponent: number): bigint => {
  // 0.01 major units expressed in this currency's minor units: 10^(exponent-2), floored at 1.
  const power = exponent - 2;
  if (power <= 0) return 1n;
  return 10n ** BigInt(power);
};

export const LEDGER_MAX_REF_LENGTH = 64;

export function toLedgerServicePayload(
  posting: TwoLeggedPosting,
  accountIdFor: (account: AccountKey, siteId: string) => string,
): Record<string, unknown> {
  const entryType = posting.entryType === 'REVENUE_RECOGNITION' ? 'ADJUSTMENT' : posting.entryType;
  if (!LEDGER_ENTRY_TYPES.has(entryType)) {
    throw new LedgerError('INVALID_ENTRY_TYPE', `ledger-service has no EntryType '${entryType}'`, { ref: posting.transactionRef });
  }

  if (posting.transactionRef.length > LEDGER_MAX_REF_LENGTH) {
    throw new LedgerError(
      'REF_TOO_LONG',
      `transactionRef '${posting.transactionRef}' is ${posting.transactionRef.length} chars; ledger-service accepts ${LEDGER_MAX_REF_LENGTH}. ` +
        'It is the idempotency key and must not be truncated — shorten the identifier it is built from.',
      { ref: posting.transactionRef },
    );
  }

  // A posting the ledger would reject for being under its minimum is caught here, where the
  // error names the amount, rather than as an opaque 400 from a validation annotation.
  const minMinor = LEDGER_MIN_AMOUNT_MINOR_UNITS(posting.amount.exponent);
  if (posting.amount.minor < minMinor) {
    throw new LedgerError(
      'AMOUNT_BELOW_LEDGER_MINIMUM',
      `${posting.amount.toDecimalString()} ${posting.currency} is below ledger-service's 0.01 minimum for a journal entry`,
      { ref: posting.transactionRef },
    );
  }

  return {
    transactionRef: posting.transactionRef,
    debitAccountId: accountIdFor(posting.debitAccount, posting.siteId),
    creditAccountId: accountIdFor(posting.creditAccount, posting.siteId),
    // A decimal string, not a float: the receiving side parses it into BigDecimal, and a
    // JSON number would be a double on the way there.
    amount: posting.amount.toDecimalString(),
    currency: posting.currency.toUpperCase(),
    entryType,
    description: posting.memo,
    // A JSON *string*. The receiving field is `String metadata` stored into a jsonb column.
    metadata: JSON.stringify({
      siteId: posting.siteId,
      tenantId: posting.tenantId,
      partyId: posting.partyId,
      legalEntityId: posting.legalEntityId,
      accounts: { debit: posting.debitAccountCode, credit: posting.creditAccountCode },
      occurredAt: posting.occurredAt,
    }),
  };
}
