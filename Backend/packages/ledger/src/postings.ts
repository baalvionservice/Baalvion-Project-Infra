/**
 * Posting rules — what journal lines each money event produces.
 *
 * Two invariants hold for every entry this module builds, and both are asserted rather than
 * assumed:
 *
 *   1. **It balances.** Debits equal credits, exactly, in integer minor units. An unbalanced
 *      entry is refused rather than posted, because a ledger that can drift is not a ledger.
 *
 *   2. **Every line carries its dimensions** — legal entity, site, tenant, party, currency.
 *      `legalEntityId` is present from the first commit precisely so it never has to be added
 *      later: back-filling an entity onto historical journal lines means re-posting the books.
 *      It is nullable today because the entity structure is not yet decided; assigning real
 *      entities later is an update, not a re-posting.
 */
import { Money } from '@baalvion/money';
import { ACCOUNTS, accountFor, increasesOnDebit, type AccountKey } from './accounts';

export class LedgerError extends Error {
  public readonly code: string;
  public readonly detail: Record<string, unknown>;
  constructor(code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'LedgerError';
    this.code = code;
    this.detail = detail;
  }
}

export interface Dimensions {
  /** Which legal entity's books these belong to. Null until the entity structure is decided. */
  legalEntityId?: string | null;
  siteId: string;
  tenantId?: string | null;
  partyId?: string | null;
  productRef?: string | null;
}

export interface JournalLine extends Dimensions {
  account: AccountKey;
  accountCode: string;
  /** Always positive; the side is the direction. */
  amount: Money;
  side: 'DEBIT' | 'CREDIT';
  memo: string;
}

export interface JournalEntry extends Dimensions {
  /** Idempotency key — posting the same reference twice must be a no-op in the store. */
  transactionRef: string;
  entryType: 'PAYMENT' | 'REFUND' | 'SETTLEMENT' | 'REVENUE_RECOGNITION';
  occurredAt: string;
  currency: string;
  lines: JournalLine[];
}

function line(
  account: AccountKey,
  side: 'DEBIT' | 'CREDIT',
  amount: Money,
  memo: string,
  dims: Dimensions,
): JournalLine {
  return {
    account,
    accountCode: accountFor(account).code,
    amount,
    side,
    memo,
    legalEntityId: dims.legalEntityId ?? null,
    siteId: dims.siteId,
    tenantId: dims.tenantId ?? null,
    partyId: dims.partyId ?? null,
    productRef: dims.productRef ?? null,
  };
}

/** Sum one side of an entry. */
function sideTotal(lines: JournalLine[], side: 'DEBIT' | 'CREDIT', currency: string): Money {
  return lines
    .filter((l) => l.side === side)
    .reduce((sum, l) => sum.add(l.amount), Money.zero(currency));
}

/**
 * The guard every entry passes before it leaves this module. Refusing an unbalanced entry here
 * is the difference between a ledger that is always correct and one that is reconciled later.
 */
export function assertBalanced(entry: JournalEntry): JournalEntry {
  if (!entry.lines.length) {
    throw new LedgerError('EMPTY_ENTRY', `Entry ${entry.transactionRef} has no lines`, { ref: entry.transactionRef });
  }
  for (const l of entry.lines) {
    if (l.amount.isNegative()) {
      throw new LedgerError(
        'NEGATIVE_LINE',
        `Entry ${entry.transactionRef} has a negative line on ${l.account}. Direction is expressed by DEBIT/CREDIT, never by sign.`,
        { ref: entry.transactionRef, account: l.account },
      );
    }
    if (l.amount.currency !== entry.currency) {
      throw new LedgerError('CURRENCY_MISMATCH', `Entry ${entry.transactionRef} mixes ${l.amount.currency} into a ${entry.currency} entry`, { ref: entry.transactionRef });
    }
  }
  const debits = sideTotal(entry.lines, 'DEBIT', entry.currency);
  const credits = sideTotal(entry.lines, 'CREDIT', entry.currency);
  if (!debits.equals(credits)) {
    throw new LedgerError(
      'UNBALANCED',
      `Entry ${entry.transactionRef} does not balance: debits ${debits.toDecimalString()} vs credits ${credits.toDecimalString()}`,
      { ref: entry.transactionRef, debits: debits.toJSON(), credits: credits.toJSON() },
    );
  }
  return entry;
}

export interface PaymentPostingInput extends Dimensions {
  paymentId: string;
  /** Gross — what the customer paid. */
  amount: Money;
  /** What the processor kept. Omit when unknown; do not pass zero to mean unknown. */
  fee?: Money | null;
  /**
   * Whether the money is earned on receipt (a one-off) or held as a liability until delivered
   * (a subscription). Getting this wrong is precisely the deferred-revenue error.
   */
  earnedOnReceipt: boolean;
  occurredAt: string;
}

/**
 * A captured payment.
 *
 * The customer paid the gross; the processor kept its fee; the business received the net. All
 * three facts are posted, which is what makes "which property makes money after fees"
 * answerable at all.
 */
export function postingsForPayment(input: PaymentPostingInput): JournalEntry {
  const { amount, fee } = input;
  const currency = amount.currency;
  if (!amount.isPositive()) {
    throw new LedgerError('INVALID_AMOUNT', `Payment ${input.paymentId} must be positive`, { paymentId: input.paymentId });
  }
  if (fee && fee.greaterThan(amount)) {
    throw new LedgerError('INVALID_FEE', `Fee ${fee.toDecimalString()} exceeds the payment ${amount.toDecimalString()}`, { paymentId: input.paymentId });
  }
  const net = fee ? amount.subtract(fee) : amount;
  const dims: Dimensions = input;

  const lines: JournalLine[] = [
    line('PSP_RECEIVABLE', 'DEBIT', net, `Captured ${amount.toDecimalString()} net of fees`, dims),
  ];
  if (fee && fee.isPositive()) {
    lines.push(line('PROCESSOR_FEES', 'DEBIT', fee, 'Processor fee', dims));
  }
  lines.push(
    input.earnedOnReceipt
      ? line('REVENUE', 'CREDIT', amount, 'Earned on delivery', dims)
      : line('DEFERRED_REVENUE', 'CREDIT', amount, 'Paid for, not yet delivered', dims),
  );

  return assertBalanced({
    transactionRef: `pay:${input.paymentId}`,
    entryType: 'PAYMENT',
    occurredAt: input.occurredAt,
    currency,
    lines,
    ...dims,
  });
}

export interface RecognitionPostingInput extends Dimensions {
  obligationId: string;
  amount: Money;
  periodStart: string;
  periodEnd: string;
  occurredAt: string;
}

/**
 * Revenue earned in a period: the liability shrinks and revenue grows by the same amount. This
 * is the entry a monthly close produces, and the one that is missing today.
 */
export function postingsForRecognition(input: RecognitionPostingInput): JournalEntry {
  if (!input.amount.isPositive()) {
    throw new LedgerError('INVALID_AMOUNT', `Recognition for ${input.obligationId} must be positive`, { obligationId: input.obligationId });
  }
  const dims: Dimensions = input;
  const memo = `Earned ${input.periodStart} to ${input.periodEnd}`;
  return assertBalanced({
    transactionRef: `rev:${input.obligationId}:${input.periodStart}`,
    entryType: 'REVENUE_RECOGNITION',
    occurredAt: input.occurredAt,
    currency: input.amount.currency,
    lines: [
      line('DEFERRED_REVENUE', 'DEBIT', input.amount, memo, dims),
      line('REVENUE', 'CREDIT', input.amount, memo, dims),
    ],
    ...dims,
  });
}

export interface RefundPostingInput extends Dimensions {
  refundId: string;
  amount: Money;
  /** True when the money being returned had not yet been earned. */
  fromDeferred: boolean;
  occurredAt: string;
}

/**
 * A refund. Posted against contra-revenue rather than by reducing revenue, so gross sales and
 * refunds stay separately visible — a month with heavy refunds should look different from a
 * quiet month, not identical to it.
 */
export function postingsForRefund(input: RefundPostingInput): JournalEntry {
  if (!input.amount.isPositive()) {
    throw new LedgerError('INVALID_AMOUNT', `Refund ${input.refundId} must be positive`, { refundId: input.refundId });
  }
  const dims: Dimensions = input;
  return assertBalanced({
    transactionRef: `refund:${input.refundId}`,
    entryType: 'REFUND',
    occurredAt: input.occurredAt,
    currency: input.amount.currency,
    lines: [
      input.fromDeferred
        ? line('DEFERRED_REVENUE', 'DEBIT', input.amount, 'Refund of undelivered service', dims)
        : line('REFUNDS', 'DEBIT', input.amount, 'Refund of earned revenue', dims),
      line('PSP_RECEIVABLE', 'CREDIT', input.amount, 'Returned to the customer', dims),
    ],
    ...dims,
  });
}

export interface SettlementPostingInput extends Dimensions {
  settlementId: string;
  amount: Money;
  occurredAt: string;
}

/** The processor pays out: a receivable becomes cash. No revenue effect — it was earned already. */
export function postingsForSettlement(input: SettlementPostingInput): JournalEntry {
  if (!input.amount.isPositive()) {
    throw new LedgerError('INVALID_AMOUNT', `Settlement ${input.settlementId} must be positive`, { settlementId: input.settlementId });
  }
  const dims: Dimensions = input;
  return assertBalanced({
    transactionRef: `settle:${input.settlementId}`,
    entryType: 'SETTLEMENT',
    occurredAt: input.occurredAt,
    currency: input.amount.currency,
    lines: [
      line('BANK', 'DEBIT', input.amount, 'Processor payout received', dims),
      line('PSP_RECEIVABLE', 'CREDIT', input.amount, 'Receivable settled', dims),
    ],
    ...dims,
  });
}

/** Net movement per account across entries — the basis of a trial balance. */
export function trialBalance(entries: JournalEntry[], currency: string): Record<string, { debit: Money; credit: Money; net: Money; type: string }> {
  const out: Record<string, { debit: Money; credit: Money; net: Money; type: string }> = {};
  const zero = Money.zero(currency);
  for (const entry of entries) {
    for (const l of entry.lines) {
      const bucket = out[l.account] ?? { debit: zero, credit: zero, net: zero, type: ACCOUNTS[l.account]!.type };
      const debit = l.side === 'DEBIT' ? bucket.debit.add(l.amount) : bucket.debit;
      const credit = l.side === 'CREDIT' ? bucket.credit.add(l.amount) : bucket.credit;
      // Net is expressed in the direction the account naturally increases, so a positive figure
      // always means "more of this account" whatever its type.
      const net = increasesOnDebit(bucket.type as never) ? debit.subtract(credit) : credit.subtract(debit);
      out[l.account] = { debit, credit, net, type: bucket.type };
    }
  }
  return out;
}
