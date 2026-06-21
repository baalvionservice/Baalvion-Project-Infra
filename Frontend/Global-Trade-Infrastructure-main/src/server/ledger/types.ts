/**
 * @file server/ledger/types.ts
 * @description Storage-agnostic contracts for the double-entry ledger and the
 * settlement engine. These mirror the persisted rows but carry no Prisma types,
 * so the posting validator and the settlement state machine can be exercised
 * with hand-built fixtures and stay decoupled from the database.
 */
import type { Money } from './money';

// ── Chart of accounts ───────────────────────────────────────────────────────

/** The five fundamental account classes of double-entry bookkeeping. */
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

/** Side on which an account's balance naturally increases. */
export type NormalSide = 'DEBIT' | 'CREDIT';

/**
 * Functional role of an account within the trade-settlement network. This is the
 * treasury vocabulary (operating cash, settlement clearing, escrow custody, …)
 * layered on top of the accounting `AccountType`.
 */
export type AccountPurpose =
  | 'OPERATING'
  | 'SETTLEMENT'
  | 'CLEARING'
  | 'ESCROW'
  | 'RESERVE'
  | 'LIQUIDITY'
  | 'FX'
  | 'FEE_INCOME'
  | 'INTEREST'
  | 'SUSPENSE'
  | 'EXTERNAL';

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

/** The default balance side for each account class. */
export const NORMAL_SIDE: Readonly<Record<AccountType, NormalSide>> = {
  ASSET: 'DEBIT',
  EXPENSE: 'DEBIT',
  LIABILITY: 'CREDIT',
  EQUITY: 'CREDIT',
  REVENUE: 'CREDIT',
};

// ── Journal postings ────────────────────────────────────────────────────────

export type EntryDirection = 'DEBIT' | 'CREDIT';

/** One leg of a journal posting, before persistence. */
export interface PostingLine {
  accountId: string;
  direction: EntryDirection;
  /** Always a positive money value; the sign is conveyed by `direction`. */
  amount: Money;
  memo?: string;
}

/** A validated, balanced set of posting legs ready to be written atomically. */
export interface BalancedPosting {
  currency: string;
  lines: PostingLine[];
  /** Equal total of the debit legs and of the credit legs (they match). */
  total: Money;
}

/** The signed effect a single account's balance experiences from a transaction. */
export interface AccountDelta {
  accountId: string;
  /** Signed in the account's NORMAL direction (positive = balance increases). */
  delta: Money;
}

// ── Settlement engine ───────────────────────────────────────────────────────

/** Lifecycle states of a settlement instruction. */
export type SettlementStatus =
  | 'CREATED'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'PARTIALLY_SETTLED'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

/** Operator/system intents that drive a settlement instruction forward. */
export type SettlementAction =
  | 'AUTHORIZE'
  | 'CAPTURE'
  | 'SETTLE'
  | 'FAIL'
  | 'CANCEL'
  | 'REVERSE';

/** Settlement rail the instruction is routed over (informational + routing). */
export type SettlementRail =
  | 'INTERNAL'
  | 'SWIFT'
  | 'SEPA'
  | 'FEDWIRE'
  | 'RTGS'
  | 'ACH'
  | 'UPI'
  | 'NEFT'
  | 'IMPS'
  | 'FPS'
  | 'BACS';

export const SETTLEMENT_RAILS: readonly SettlementRail[] = [
  'INTERNAL',
  'SWIFT',
  'SEPA',
  'FEDWIRE',
  'RTGS',
  'ACH',
  'UPI',
  'NEFT',
  'IMPS',
  'FPS',
  'BACS',
];

export const SETTLEMENT_TERMINAL: ReadonlySet<SettlementStatus> = new Set<SettlementStatus>([
  'SETTLED',
  'FAILED',
  'CANCELLED',
  'REVERSED',
]);
