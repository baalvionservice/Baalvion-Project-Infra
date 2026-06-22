/**
 * @file server/treasury/accounts/treasury-accounts.ts
 * @description The named treasury accounts and their backing ledger-account
 * shape. This ledger uses a value-location convention: every balance-bearing
 * account is an ASSET (debit-normal) and money is moved by balanced transfers,
 * with allow-negative reserved for internal clearing/suspense pools that legally
 * swing either way. One treasury account exists per (kind, currency).
 */
import type { AccountType, NormalSide } from '../../ledger/types';
import { TreasuryAccountKind } from '../types';

export interface TreasuryAccountSpec {
  type: AccountType;
  normalSide: NormalSide;
  purpose: string;
  allowNegative: boolean;
}

const SPECS: Readonly<Record<TreasuryAccountKind, TreasuryAccountSpec>> = {
  OPERATING: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'OPERATING', allowNegative: false },
  SETTLEMENT: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'SETTLEMENT', allowNegative: false },
  RESERVE: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'RESERVE', allowNegative: false },
  LIQUIDITY: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'LIQUIDITY', allowNegative: false },
  ESCROW: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'ESCROW', allowNegative: false },
  // Interest and FX clearing legally swing negative between accrual/settlement.
  INTEREST: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'INTEREST', allowNegative: true },
  FX: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'FX_CLEARING', allowNegative: true },
  FEE: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'FEE_INCOME', allowNegative: false },
  SUSPENSE: { type: 'ASSET', normalSide: 'DEBIT', purpose: 'SUSPENSE', allowNegative: true },
};

export function treasuryAccountSpec(kind: TreasuryAccountKind): TreasuryAccountSpec {
  const spec = SPECS[kind];
  if (!spec) throw new Error(`UNKNOWN_TREASURY_KIND: ${kind}`);
  return spec;
}

/** Deterministic, unique-per-tenant code for a treasury account. */
export function treasuryAccountCode(kind: TreasuryAccountKind, currency: string): string {
  return `TREASURY:${kind}:${currency.toUpperCase()}`;
}
