/**
 * @file ledger-service.ts
 * @description The authoritative, immutable source of truth for all institutional financial movements.
 *
 * Ledger is owned by the Java ledger-service (financial-services-java, /api/v1/ledger) — same
 * retirement pattern as escrow (see escrow-service.ts header). Real entries are double-entry:
 * every post needs BOTH a debitAccountId and a creditAccountId (account-service UUIDs, not org
 * ids). There is no generic single-sided "debit company X" endpoint on the real ledger.
 */
import { financeClient } from '@/lib/finance-client';
import { logger, metricsService } from './observability-service';

export type LedgerTransactionType = 'debit' | 'credit';
export type LedgerReferenceType = 'order' | 'escrow' | 'refund' | 'deposit' | 'withdrawal';

export interface LedgerEntry {
  id: string;
  companyId: string;
  type: LedgerTransactionType;
  amount: number;
  currency: string;
  referenceType: LedgerReferenceType;
  referenceId: string;
  description: string;
  hash?: string; // Cryptographic proof placeholder
  createdAt: string;
}

/**
 * Posts a real double-entry ledger entry. This is the only system-sanctioned way to move
 * money between two account-service accounts outside of the escrow hold/release/refund
 * lifecycle (which posts its own entries server-side via the Kafka event listener).
 */
export async function postLedgerEntry(entry: {
  transactionRef: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: number;
  currency: string;
  entryType: string;
  description?: string;
}): Promise<LedgerEntry> {
  logger.info('LedgerService', `Posting ${entry.entryType}: ${entry.debitAccountId} -> ${entry.creditAccountId}`, { amount: entry.amount, ref: entry.transactionRef });

  const res = await financeClient.post<any>('/ledger/entries', entry);
  if (!res.success || !res.data) {
    logger.error('LedgerService', `LEDGER_COMMIT_FAILED: Ref ${entry.transactionRef}`);
    throw new Error(res.error?.message || 'Ledger recording critical failure.');
  }

  metricsService.recordMetric('ledger_transaction_volume', entry.amount);
  const posted = res.data;
  return {
    id: String(posted.id ?? ''),
    companyId: '',
    type: 'debit',
    amount: entry.amount,
    currency: entry.currency,
    referenceType: 'order',
    referenceId: entry.transactionRef,
    description: entry.description || '',
    createdAt: posted.createdAt || new Date().toISOString(),
  };
}

/**
 * @deprecated Superseded by {@link postLedgerEntry}. This single-sided shape (one company, no
 * counterparty account) predates the real integration and cannot be mapped onto the real
 * double-entry ledger — a post needs both a debitAccountId and a creditAccountId. Money
 * movements tied to an escrow now happen automatically server-side when the hold is created/
 * released (see escrow-service.ts); there is no remaining in-app caller for a bare "record a
 * transaction for company X" call. Throws instead of silently no-op'ing so any surviving caller
 * fails loudly rather than believing money moved when it did not.
 */
export async function recordTransaction(_entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
  throw new Error(
    'recordTransaction is retired: the real ledger requires a debit AND credit account id. ' +
    'Use postLedgerEntry(), or — for escrow funds — rely on the automatic server-side posting ' +
    'that already happens when an escrow hold is created/released.'
  );
}
