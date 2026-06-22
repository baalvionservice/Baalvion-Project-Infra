/**
 * @file server/treasury/wallets/wallet-buckets.ts
 * @description The wallet bucket model and the balanced ledger postings each
 * wallet operation implies. A wallet owns four debit-normal ASSET ledger
 * accounts (AVAILABLE / HELD / RESERVED / PENDING); every operation is a
 * balanced transfer, so the wallet's funds are only ever a derived sum of
 * immutable ledger entries — never a mutable balance of record.
 */
import { Money } from '../../ledger/money';
import { PostingLine, transfer } from '../../ledger/posting';
import { WalletBucket, WalletOp } from '../types';

export class WalletOpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletOpError';
  }
}

/** The four ledger account ids backing a wallet's buckets. */
export interface WalletAccounts {
  available: string;
  held: string;
  reserved: string;
  pending: string;
}

export const BUCKET_PURPOSE: Readonly<Record<WalletBucket, string>> = {
  AVAILABLE: 'WALLET_AVAILABLE',
  HELD: 'WALLET_HELD',
  RESERVED: 'WALLET_RESERVED',
  PENDING: 'WALLET_PENDING',
};

/** Operations that move money across the wallet boundary need a counter account. */
const REQUIRES_COUNTER: ReadonlySet<WalletOp> = new Set<WalletOp>(['CREDIT', 'DEBIT', 'MARK_PENDING']);

export function requiresCounterAccount(op: WalletOp): boolean {
  return REQUIRES_COUNTER.has(op);
}

/**
 * Build the balanced posting legs for a wallet operation. `counterAccountId` is
 * required for boundary ops (CREDIT / DEBIT / MARK_PENDING) and ignored for
 * internal bucket moves.
 */
export function walletOpPosting(
  op: WalletOp,
  accounts: WalletAccounts,
  amount: Money,
  counterAccountId?: string,
): PostingLine[] {
  if (!amount.isPositive()) throw new WalletOpError('NON_POSITIVE_AMOUNT: wallet operation amount must be positive');
  if (REQUIRES_COUNTER.has(op) && !counterAccountId) {
    throw new WalletOpError(`COUNTER_REQUIRED: ${op} needs a counter account`);
  }
  const counter = counterAccountId ?? '';

  switch (op) {
    case 'CREDIT':
      return transfer(counter, accounts.available, amount, 'wallet.credit');
    case 'DEBIT':
      return transfer(accounts.available, counter, amount, 'wallet.debit');
    case 'HOLD':
      return transfer(accounts.available, accounts.held, amount, 'wallet.hold');
    case 'RELEASE':
      return transfer(accounts.held, accounts.available, amount, 'wallet.release');
    case 'RESERVE':
      return transfer(accounts.available, accounts.reserved, amount, 'wallet.reserve');
    case 'UNRESERVE':
      return transfer(accounts.reserved, accounts.available, amount, 'wallet.unreserve');
    case 'MARK_PENDING':
      return transfer(counter, accounts.pending, amount, 'wallet.mark_pending');
    case 'CLEAR_PENDING':
      return transfer(accounts.pending, accounts.available, amount, 'wallet.clear_pending');
    default:
      throw new WalletOpError(`UNKNOWN_WALLET_OP: ${String(op)}`);
  }
}
