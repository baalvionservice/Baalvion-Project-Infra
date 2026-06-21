/**
 * @file server/services/reconciliation-service.ts
 * @description Reconciliation: proves the derived/cached numbers agree with the
 * immutable ledger. For each ledger account, the maintained balance must equal
 * the signed sum of its entries; for each wallet, the cached projection must
 * equal a fresh derivation. Read-only — it reports, it does not mutate history.
 */
import { withTransaction } from '../db/prisma';
import { NotFoundError } from '../db/errors';
import { ledgerAccountRepository, ledgerEntryRepository, walletRepository, walletProjectionRepository } from '../repositories';
import { Money } from '../ledger/money';
import { deriveWalletTx } from './projection-service';
import { balancesToStrings } from '../treasury/balances/wallet-balances';
import type { ActorContext } from './rule-service';

export type { ActorContext };

export interface AccountReconcileResult {
  accountId: string;
  code: string;
  storedBalance: string;
  derivedBalance: string;
  matched: boolean;
}

export interface WalletReconcileResult {
  walletId: string;
  matched: boolean;
  cached: Record<string, string> | null;
  derived: Record<string, string>;
}

async function reconcileAccountRow(
  accountId: string,
  normalSide: string,
  storedBalance: string,
  currency: string,
): Promise<{ derived: Money; matched: boolean }> {
  const flow = await ledgerEntryRepository.sumByDirection(accountId);
  const debit = Money.of(flow.debit, currency);
  const credit = Money.of(flow.credit, currency);
  const derived = normalSide === 'DEBIT' ? debit.subtract(credit) : credit.subtract(debit);
  return { derived, matched: derived.equals(Money.of(storedBalance, currency)) };
}

export const reconciliationService = {
  /** Reconcile one ledger account's stored balance against its entry history. */
  async reconcileAccount(ctx: ActorContext, accountId: string): Promise<AccountReconcileResult> {
    const account = await ledgerAccountRepository.findScopedById(accountId, ctx.organizationId);
    if (!account) throw new NotFoundError('LedgerAccount', accountId);
    const { derived, matched } = await reconcileAccountRow(account.id, account.normalSide, account.balance.toString(), account.currency);
    return { accountId: account.id, code: account.code, storedBalance: Money.of(account.balance.toString(), account.currency).toDecimalString(), derivedBalance: derived.toDecimalString(), matched };
  },

  /** Reconcile every ledger account for the tenant; report any mismatches. */
  async reconcileLedger(ctx: ActorContext, currency?: string): Promise<{ totalAccounts: number; matched: number; mismatches: AccountReconcileResult[] }> {
    const accounts = await ledgerAccountRepository.listAllScoped(ctx.organizationId, currency);
    const mismatches: AccountReconcileResult[] = [];
    let matched = 0;
    for (const account of accounts) {
      const r = await reconcileAccountRow(account.id, account.normalSide, account.balance.toString(), account.currency);
      if (r.matched) matched += 1;
      else mismatches.push({ accountId: account.id, code: account.code, storedBalance: Money.of(account.balance.toString(), account.currency).toDecimalString(), derivedBalance: r.derived.toDecimalString(), matched: false });
    }
    return { totalAccounts: accounts.length, matched, mismatches };
  },

  /** Reconcile a wallet's cached projection against a fresh ledger derivation. */
  async reconcileWallet(ctx: ActorContext, walletId: string): Promise<WalletReconcileResult> {
    const wallet = await walletRepository.findScopedById(walletId, ctx.organizationId);
    if (!wallet) throw new NotFoundError('Wallet', walletId);
    const cachedRow = await walletProjectionRepository.findByWalletId(walletId);
    const derived = await withTransaction((tx) => deriveWalletTx(tx, ctx, wallet));
    const derivedStrings = balancesToStrings(derived.balances);
    const cached = cachedRow
      ? {
          available: Money.of(cachedRow.available.toString(), wallet.currency).toDecimalString(),
          held: Money.of(cachedRow.held.toString(), wallet.currency).toDecimalString(),
          reserved: Money.of(cachedRow.reserved.toString(), wallet.currency).toDecimalString(),
          pending: Money.of(cachedRow.pending.toString(), wallet.currency).toDecimalString(),
          total: Money.of(cachedRow.total.toString(), wallet.currency).toDecimalString(),
          projected: Money.of(cachedRow.projected.toString(), wallet.currency).toDecimalString(),
        }
      : null;
    const matched =
      cached !== null &&
      cached.available === derivedStrings.available &&
      cached.held === derivedStrings.held &&
      cached.reserved === derivedStrings.reserved &&
      cached.pending === derivedStrings.pending &&
      cached.total === derivedStrings.total &&
      cached.projected === derivedStrings.projected;
    return { walletId, matched, cached, derived: derivedStrings };
  },
};
