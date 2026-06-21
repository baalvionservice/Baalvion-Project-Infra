/**
 * @file server/services/treasury-account-service.ts
 * @description Provisions and lists the platform's named treasury accounts
 * (Operating, Settlement, Reserve, Liquidity, Escrow, Interest, FX, Fee,
 * Suspense), one per (kind, currency). Each is backed by a real ledger account;
 * provisioning is idempotent and atomic.
 */
import { randomUUID } from 'crypto';
import { TreasuryAccount, LedgerAccount } from '@prisma/client';
import { withTransaction, PrismaTransaction } from '../db/prisma';
import { NotFoundError } from '../db/errors';
import { treasuryAccountRepository, ledgerAccountRepository } from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { auditWrite, enqueueEvent, snapshot } from '../orchestration/write-helpers';
import { createLedgerAccountTx } from '../treasury/ledger-bridge';
import { treasuryAccountSpec, treasuryAccountCode } from '../treasury/accounts/treasury-accounts';
import { TreasuryAccountKind } from '../treasury/types';
import { Money } from '../ledger/money';
import type { ActorContext } from './rule-service';

export type { ActorContext };

/** Resolve (and create on first use) the treasury account for a kind+currency, inside a tx. */
export async function getOrCreateTreasuryAccountTx(
  tx: PrismaTransaction,
  ctx: ActorContext,
  kind: TreasuryAccountKind,
  currency: string,
  correlationId: string,
): Promise<TreasuryAccount> {
  const cur = Money.zero(currency).currency;
  const existing = await treasuryAccountRepository.findByKindCurrency(ctx.organizationId, kind, cur, tx);
  if (existing) return existing;

  const spec = treasuryAccountSpec(kind);
  const code = treasuryAccountCode(kind, cur);
  // Reuse the ledger account if one already exists for this code, else create it.
  let ledger: LedgerAccount | null = await ledgerAccountRepository.findByCode(ctx.organizationId, code, tx);
  if (!ledger) {
    ledger = await createLedgerAccountTx(
      tx,
      ctx,
      { code, name: `Treasury ${kind} ${cur}`, type: spec.type, normalSide: spec.normalSide, purpose: spec.purpose, allowNegative: spec.allowNegative, currency: cur },
      correlationId,
    );
  }

  const row = (await treasuryAccountRepository.create(
    { organizationId: ctx.organizationId, kind, currency: cur, ledgerAccountId: ledger.id, status: 'ACTIVE' },
    tx,
  )) as TreasuryAccount;
  await auditWrite(tx, ctx, { source: 'treasury', entityType: 'TreasuryAccount', entityId: row.id, action: 'CREATE', after: snapshot(row), correlationId });
  await enqueueEvent(tx, ctx, { eventType: 'TREASURY_ACCOUNT_PROVISIONED', payload: { treasuryAccountId: row.id, kind, currency: cur, ledgerAccountId: ledger.id }, correlationId });
  return row;
}

export const treasuryAccountService = {
  async provision(ctx: ActorContext, kind: TreasuryAccountKind, currency: string): Promise<TreasuryAccount> {
    const correlationId = randomUUID();
    const account = await withTransaction((tx) => getOrCreateTreasuryAccountTx(tx, ctx, kind, currency, correlationId));
    await flushOutbox();
    return account;
  },

  list(ctx: ActorContext, filter: { kind?: string; currency?: string }): Promise<TreasuryAccount[]> {
    return treasuryAccountRepository.listScoped(ctx.organizationId, filter);
  },

  async get(ctx: ActorContext, id: string): Promise<TreasuryAccount> {
    const account = await treasuryAccountRepository.findScopedById(id, ctx.organizationId);
    if (!account) throw new NotFoundError('TreasuryAccount', id);
    return account;
  },
};
