/**
 * @file server/services/wallet-service.ts
 * @description The wallet engine. A wallet is four debit-normal ASSET ledger
 * accounts (AVAILABLE / HELD / RESERVED / PENDING); opening one provisions the
 * four accounts atomically. Every operation (credit, debit, hold, release,
 * reserve, unreserve, mark-pending, clear-pending) is a BALANCED ledger posting
 * applied through the ledger's `applyPostingTx`, after which the cached
 * projection is refreshed in the same transaction. Wallet balances are therefore
 * always a derived sum of immutable ledger entries — never a stored balance.
 */
import { randomUUID } from 'crypto';
import { Wallet, WalletProjection, LedgerTransaction } from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import { walletRepository, ledgerTransactionRepository, ledgerEntryRepository, WalletFilter } from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { auditWrite, enqueueEvent, snapshot } from '../orchestration/write-helpers';
import { applyPostingTx } from './ledger-service';
import { refreshProjectionTx } from './projection-service';
import { createLedgerAccountTx } from '../treasury/ledger-bridge';
import { walletOpPosting, requiresCounterAccount, BUCKET_PURPOSE, WalletAccounts } from '../treasury/wallets/wallet-buckets';
import { buildPosting } from '../ledger/posting';
import { Money } from '../ledger/money';
import { WalletType, WalletOp, WalletBucket } from '../treasury/types';
import type { ActorContext } from './rule-service';

export type { ActorContext };

export interface OpenWalletInput {
  type: WalletType;
  currency: string;
  ownerOrgId?: string;
  ownerRef?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface WalletOperationInput {
  op: WalletOp;
  amount: string | number;
  counterAccountId?: string;
  reference?: string;
  reason?: string;
}

export interface WalletOperationResult {
  wallet: Wallet;
  ledgerTransactionId: string;
  projection: WalletProjection;
  idempotentReplay: boolean;
}

function walletAccounts(wallet: Wallet): WalletAccounts {
  return {
    available: wallet.availableAccountId,
    held: wallet.heldAccountId,
    reserved: wallet.reservedAccountId,
    pending: wallet.pendingAccountId,
  };
}

export const walletService = {
  async openWallet(ctx: ActorContext, input: OpenWalletInput): Promise<Wallet> {
    if (input.reference) {
      const existing = await walletRepository.findByReference(ctx.organizationId, input.reference);
      if (existing) return existing;
    }
    const currency = Money.zero(input.currency).currency; // validate ISO-4217
    const walletId = randomUUID();
    const correlationId = randomUUID();

    const created = await withTransaction(async (tx) => {
      const accountIds: Record<WalletBucket, string> = { AVAILABLE: '', HELD: '', RESERVED: '', PENDING: '' };
      for (const bucket of ['AVAILABLE', 'HELD', 'RESERVED', 'PENDING'] as WalletBucket[]) {
        const account = await createLedgerAccountTx(
          tx,
          ctx,
          {
            code: `WALLET:${walletId}:${bucket}:${currency}`,
            name: `${input.type} wallet ${bucket.toLowerCase()} (${currency})`,
            type: 'ASSET',
            normalSide: 'DEBIT',
            purpose: BUCKET_PURPOSE[bucket],
            allowNegative: false,
            currency,
            ownerOrgId: input.ownerOrgId ?? null,
          },
          correlationId,
        );
        accountIds[bucket] = account.id;
      }

      const wallet = (await walletRepository.create(
        {
          id: walletId,
          organizationId: ctx.organizationId,
          type: input.type,
          ownerOrgId: input.ownerOrgId ?? null,
          ownerRef: input.ownerRef ?? null,
          currency,
          status: 'ACTIVE',
          reference: input.reference ?? null,
          availableAccountId: accountIds.AVAILABLE,
          heldAccountId: accountIds.HELD,
          reservedAccountId: accountIds.RESERVED,
          pendingAccountId: accountIds.PENDING,
          metadata: input.metadata ? (input.metadata as object) : undefined,
        },
        tx,
      )) as Wallet;

      await auditWrite(tx, ctx, { source: 'wallet', entityType: 'Wallet', entityId: wallet.id, action: 'CREATE', after: snapshot(wallet), correlationId });
      await enqueueEvent(tx, ctx, { eventType: 'WALLET_OPENED', payload: { walletId: wallet.id, type: wallet.type, currency }, correlationId });
      return wallet;
    });
    await flushOutbox();
    return created;
  },

  async operate(ctx: ActorContext, walletId: string, input: WalletOperationInput): Promise<WalletOperationResult> {
    const wallet = await walletRepository.findScopedById(walletId, ctx.organizationId);
    if (!wallet) throw new NotFoundError('Wallet', walletId);
    if (wallet.status !== 'ACTIVE') throw new ValidationError(`WALLET_NOT_ACTIVE: ${walletId} is ${wallet.status}`);
    if (requiresCounterAccount(input.op) && !input.counterAccountId) {
      throw new ValidationError(`COUNTER_REQUIRED: ${input.op} needs counterAccountId`);
    }

    // Idempotent replay: a prior posting with the same reference is the result.
    if (input.reference) {
      const prior = await ledgerTransactionRepository.findByReference(ctx.organizationId, input.reference);
      if (prior) {
        const projection = await withTransaction((tx) => refreshProjectionTx(tx, ctx, wallet, new Date()));
        await flushOutbox();
        return { wallet, ledgerTransactionId: prior.id, projection, idempotentReplay: true };
      }
    }

    const amount = Money.of(input.amount, wallet.currency);
    const posting = buildPosting(walletOpPosting(input.op, walletAccounts(wallet), amount, input.counterAccountId));
    const correlationId = randomUUID();

    const result = await withTransaction(async (tx) => {
      const txn: LedgerTransaction = await applyPostingTx(tx, ctx, posting, {
        correlationId,
        reference: input.reference ?? null,
        description: `wallet.${input.op.toLowerCase()} ${walletId}`,
        source: 'wallet',
      });
      const projection = await refreshProjectionTx(tx, ctx, wallet, new Date());
      await auditWrite(tx, ctx, {
        source: 'wallet',
        entityType: 'Wallet',
        entityId: walletId,
        action: `OP_${input.op}`,
        after: snapshot({ op: input.op, amount: amount.toDecimalString(), ledgerTransactionId: txn.id }),
        correlationId,
      });
      await enqueueEvent(tx, ctx, {
        eventType: `WALLET_${input.op}`,
        payload: { walletId, op: input.op, amount: amount.toDecimalString(), currency: wallet.currency, ledgerTransactionId: txn.id, reason: input.reason ?? null },
        correlationId,
      });
      return { ledgerTransactionId: txn.id, projection };
    });
    await flushOutbox();
    return { wallet, ledgerTransactionId: result.ledgerTransactionId, projection: result.projection, idempotentReplay: false };
  },

  async setStatus(ctx: ActorContext, walletId: string, status: 'ACTIVE' | 'FROZEN' | 'CLOSED', reason?: string): Promise<Wallet> {
    const correlationId = randomUUID();
    const updated = await withTransaction(async (tx) => {
      const before = await walletRepository.findScopedById(walletId, ctx.organizationId, tx);
      if (!before) throw new NotFoundError('Wallet', walletId);
      if (status === 'CLOSED') {
        for (const accountId of [before.availableAccountId, before.heldAccountId, before.reservedAccountId, before.pendingAccountId]) {
          const flow = await ledgerEntryRepository.sumByDirection(accountId, tx);
          if (!Money.of(flow.debit, before.currency).subtract(Money.of(flow.credit, before.currency)).isZero()) {
            throw new ValidationError('WALLET_NOT_EMPTY: cannot close a wallet with non-zero buckets');
          }
        }
      }
      const row = await walletRepository.setStatus(walletId, status, tx);
      await auditWrite(tx, ctx, { source: 'wallet', entityType: 'Wallet', entityId: walletId, action: `STATUS_${status}`, before: snapshot(before), after: snapshot(row), correlationId });
      await enqueueEvent(tx, ctx, { eventType: 'WALLET_STATUS_CHANGED', payload: { walletId, status, reason: reason ?? null }, correlationId });
      return row;
    });
    await flushOutbox();
    return updated;
  },

  async getWallet(ctx: ActorContext, walletId: string): Promise<Wallet> {
    const wallet = await walletRepository.findScopedById(walletId, ctx.organizationId);
    if (!wallet) throw new NotFoundError('Wallet', walletId);
    return wallet;
  },

  listWallets(ctx: ActorContext, filter: WalletFilter, page: { page: number; pageSize: number }) {
    return walletRepository.listScoped(ctx.organizationId, filter, page);
  },
};
