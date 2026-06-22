/**
 * @file server/treasury/types.ts
 * @description Storage-agnostic contracts for the treasury, wallet, FX, fee and
 * liquidity engines. These mirror the persisted rows but carry no Prisma types,
 * so the pure engines (balance derivation, fee math, FX math) can be exercised
 * with hand-built fixtures and stay decoupled from the database.
 */
import type { Money } from '../ledger/money';

// ── Wallets ──────────────────────────────────────────────────────────────────

/** The kinds of wallet the platform issues. */
export type WalletType =
  | 'USER'
  | 'COMPANY'
  | 'MERCHANT'
  | 'ESCROW'
  | 'RESERVE'
  | 'TREASURY'
  | 'VIRTUAL'
  | 'SETTLEMENT'
  | 'INTEREST';

export const WALLET_TYPES: readonly WalletType[] = [
  'USER', 'COMPANY', 'MERCHANT', 'ESCROW', 'RESERVE', 'TREASURY', 'VIRTUAL', 'SETTLEMENT', 'INTEREST',
];

/**
 * A wallet's funds are partitioned across four ledger sub-accounts ("buckets").
 * Every bucket is a real ledger account, so every wallet balance is a derived
 * sum of immutable ledger entries — there is no mutable balance of record.
 */
export type WalletBucket = 'AVAILABLE' | 'HELD' | 'RESERVED' | 'PENDING';

export const WALLET_BUCKETS: readonly WalletBucket[] = ['AVAILABLE', 'HELD', 'RESERVED', 'PENDING'];

export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

/** Bucket balances of a wallet, all in the wallet's single currency. */
export interface BucketBalances {
  available: Money;
  held: Money;
  reserved: Money;
  pending: Money;
}

/** Gross lifetime flows through the wallet's PENDING bucket. */
export interface WalletFlows {
  incoming: Money; // gross debits into PENDING (inbound parked)
  outgoing: Money; // gross credits out of PENDING (pending released/withdrawn)
}

/** The full derived balance view of a wallet. */
export interface WalletBalances extends BucketBalances, WalletFlows {
  currency: string;
  total: Money; // available + held + reserved + pending
  projected: Money; // available + pending (spendable once pending clears)
}

/** A wallet operation that moves money between buckets or across the boundary. */
export type WalletOp =
  | 'CREDIT' // external → available (funds arrive)
  | 'DEBIT' // available → external (funds leave)
  | 'HOLD' // available → held
  | 'RELEASE' // held → available
  | 'RESERVE' // available → reserved
  | 'UNRESERVE' // reserved → available
  | 'MARK_PENDING' // external → pending (inbound not yet cleared)
  | 'CLEAR_PENDING'; // pending → available (inbound cleared)

export const WALLET_OPS: readonly WalletOp[] = [
  'CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'RESERVE', 'UNRESERVE', 'MARK_PENDING', 'CLEAR_PENDING',
];

// ── Treasury accounts ────────────────────────────────────────────────────────

/** The named treasury accounts that back platform money operations. */
export type TreasuryAccountKind =
  | 'OPERATING'
  | 'SETTLEMENT'
  | 'RESERVE'
  | 'LIQUIDITY'
  | 'ESCROW'
  | 'INTEREST'
  | 'FX'
  | 'FEE'
  | 'SUSPENSE';

export const TREASURY_ACCOUNT_KINDS: readonly TreasuryAccountKind[] = [
  'OPERATING', 'SETTLEMENT', 'RESERVE', 'LIQUIDITY', 'ESCROW', 'INTEREST', 'FX', 'FEE', 'SUSPENSE',
];

// ── Fees ─────────────────────────────────────────────────────────────────────

export type FeeType = 'FLAT' | 'PERCENTAGE' | 'TIER';
export const FEE_TYPES: readonly FeeType[] = ['FLAT', 'PERCENTAGE', 'TIER'];

/** Where/why a fee applies (data-ish vocabulary, validated at the boundary). */
export type FeeScope =
  | 'SETTLEMENT'
  | 'FX'
  | 'BANK'
  | 'PLATFORM'
  | 'PARTNER'
  | 'PROCESSING'
  | 'COUNTRY'
  | 'CURRENCY';

export const FEE_SCOPES: readonly FeeScope[] = [
  'SETTLEMENT', 'FX', 'BANK', 'PLATFORM', 'PARTNER', 'PROCESSING', 'COUNTRY', 'CURRENCY',
];

/** One band of a tiered fee schedule. `upToAmount` null = the open top band. */
export interface FeeTier {
  upToAmount: string | null; // inclusive upper bound (decimal string), null = ∞
  basisPoints?: number;
  flatAmount?: string;
}

/** Storage-agnostic fee rule consumed by the fee calculator. */
export interface FeeRuleDefinition {
  type: FeeType;
  currency: string;
  basisPoints?: number | null; // for PERCENTAGE
  flatAmount?: string | null; // for FLAT
  tiers?: FeeTier[] | null; // for TIER
  minFee?: string | null;
  maxFee?: string | null;
}

// ── FX ───────────────────────────────────────────────────────────────────────

export type FXQuoteStatus = 'QUOTED' | 'LOCKED' | 'EXPIRED' | 'EXECUTED' | 'CANCELLED';
export type FXTradeStatus = 'EXECUTED' | 'REVERSED';

/** A priced FX quote (all amounts/rates as decimal strings). */
export interface FXPricing {
  midRate: string;
  spreadBps: number;
  marginBps: number;
  allInRate: string; // mid marked the platform's way by (spread + margin)
}
