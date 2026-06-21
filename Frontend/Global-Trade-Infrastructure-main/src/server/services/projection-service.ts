/**
 * @file server/services/projection-service.ts
 * @description Derives a wallet's full balance view from its four bucket ledger
 * accounts and the immutable pending-bucket entry flows, and maintains the
 * cached `wallet_projections` row. The ledger is authoritative; the projection
 * is only a recomputable cache, so it can be rebuilt at any time and reconciled.
 */
import { Wallet, WalletProjection } from '@prisma/client';
import { withTransaction, PrismaTransaction } from '../db/prisma';
import { NotFoundError } from '../db/errors';
import { ledgerAccountRepository, ledgerEntryRepository, walletProjectionRepository, walletRepository } from '../repositories';
import { Money } from '../ledger/money';
import { deriveWalletBalances, balancesToStrings } from '../treasury/balances/wallet-balances';
import { WalletBalances } from '../treasury/types';
import type { ActorContext } from './rule-service';

async function balanceOf(accountId: string, organizationId: string, tx: PrismaTransaction, currency: string): Promise<Money> {
  const account = await ledgerAccountRepository.findScopedById(accountId, organizationId, tx);
  if (!account) throw new NotFoundError('LedgerAccount', accountId);
  return Money.of(account.balance.toString(), currency);
}

export interface DerivedWallet {
  balances: WalletBalances;
  entryCount: number;
}

/** Derive a wallet's balances purely from ledger state (within the caller's tx). */
export async function deriveWalletTx(tx: PrismaTransaction, ctx: ActorContext, wallet: Wallet): Promise<DerivedWallet> {
  const cur = wallet.currency;
  const [available, held, reserved] = await Promise.all([
    balanceOf(wallet.availableAccountId, ctx.organizationId, tx, cur),
    balanceOf(wallet.heldAccountId, ctx.organizationId, tx, cur),
    balanceOf(wallet.reservedAccountId, ctx.organizationId, tx, cur),
  ]);
  // PENDING bucket: debits = inbound (incoming), credits = released (outgoing);
  // its net balance is incoming − outgoing by construction.
  const flow = await ledgerEntryRepository.sumByDirection(wallet.pendingAccountId, tx);
  const incoming = Money.of(flow.debit, cur);
  const outgoing = Money.of(flow.credit, cur);
  const pending = incoming.subtract(outgoing);

  const balances = deriveWalletBalances({ available, held, reserved, pending }, { incoming, outgoing });
  return { balances, entryCount: flow.count };
}

/** Recompute and upsert the cached projection within the caller's tx. */
export async function refreshProjectionTx(
  tx: PrismaTransaction,
  ctx: ActorContext,
  wallet: Wallet,
  computedAt: Date,
): Promise<WalletProjection> {
  const { balances, entryCount } = await deriveWalletTx(tx, ctx, wallet);
  const s = balancesToStrings(balances);
  return walletProjectionRepository.upsert(
    {
      organizationId: ctx.organizationId,
      walletId: wallet.id,
      currency: balances.currency,
      available: s.available,
      held: s.held,
      reserved: s.reserved,
      pending: s.pending,
      incoming: s.incoming,
      outgoing: s.outgoing,
      total: s.total,
      projected: s.projected,
      computedAt,
      sourceEntryCount: entryCount,
    },
    tx,
  );
}

export const projectionService = {
  /** Live, authoritative balances derived from the ledger; also refreshes the cache. */
  async getBalances(ctx: ActorContext, walletId: string): Promise<{ walletId: string; balances: Record<string, string>; projection: WalletProjection }> {
    const wallet = await walletRepository.findScopedById(walletId, ctx.organizationId);
    if (!wallet) throw new NotFoundError('Wallet', walletId);
    const computedAt = new Date();
    const result = await withTransaction(async (tx) => {
      const { balances } = await deriveWalletTx(tx, ctx, wallet);
      const projection = await refreshProjectionTx(tx, ctx, wallet, computedAt);
      return { balances: balancesToStrings(balances), projection };
    });
    return { walletId, balances: result.balances, projection: result.projection };
  },

  /** Read the cached projection without recomputing (may be stale). */
  getCachedProjection(ctx: ActorContext, walletId: string): Promise<WalletProjection | null> {
    return walletProjectionRepository.findByWalletId(walletId);
  },
};
