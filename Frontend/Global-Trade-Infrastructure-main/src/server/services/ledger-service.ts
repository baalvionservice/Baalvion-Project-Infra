/**
 * @file server/services/ledger-service.ts
 * @description The double-entry ledger application service — the financial
 * source of truth every money movement on the platform posts into.
 *
 * The core is {@link applyPostingTx}: given a validated balanced posting it loads
 * the referenced accounts, enforces currency / status / sufficient-funds rules,
 * advances each account balance under optimistic locking, writes one immutable
 * `ledger_transaction` plus its append-only `ledger_entries`, an immutable audit
 * row and a transactional-outbox event — all in ONE database transaction. The
 * settlement engine reuses this same primitive, so every rail's money movement
 * goes through the identical balanced-posting guarantee.
 *
 * Tenancy: all rows are tenant-owned (organizationId = the caller's org), which
 * satisfies the RLS WITH CHECK policy.
 */
import { randomUUID } from 'crypto';
import { Prisma, LedgerAccount, LedgerTransaction, LedgerEntry } from '@prisma/client';
import { withTransaction, PrismaTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import {
  ledgerAccountRepository,
  ledgerTransactionRepository,
  ledgerEntryRepository,
  auditRepository,
  outboxRepository,
  LedgerAccountFilter,
  LedgerTransactionFilter,
  LedgerEntryInput,
} from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { Money } from '../ledger/money';
import { buildPosting, PostingLine } from '../ledger/posting';
import { BalancedPosting, EntryDirection, NormalSide } from '../ledger/types';
import type { ActorContext } from './rule-service';
import {
  OpenAccountInput,
  PostJournalInput,
} from '../ledger/schemas';

export type { ActorContext };

const ACCOUNT_TYPE_NORMAL: Readonly<Record<string, NormalSide>> = {
  ASSET: 'DEBIT',
  EXPENSE: 'DEBIT',
  LIABILITY: 'CREDIT',
  EQUITY: 'CREDIT',
  REVENUE: 'CREDIT',
};

interface PostingMeta {
  correlationId: string;
  reference?: string | null;
  description?: string | null;
  source?: string;
  tradeId?: string | null;
  reversalOfId?: string | null;
}

interface AggregatedLeg {
  direction: EntryDirection;
  amount: Money;
  memo?: string;
}

function snapshot<T>(row: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function moneyOfAccount(account: LedgerAccount): Money {
  return Money.of(account.balance.toString(), account.currency);
}

async function audit(
  tx: PrismaTransaction,
  ctx: ActorContext,
  entityType: string,
  entityId: string,
  action: string,
  before: Prisma.InputJsonValue | null,
  after: Prisma.InputJsonValue | null,
  correlationId: string,
  tradeId?: string | null,
): Promise<void> {
  await auditRepository.record(
    {
      organizationId: ctx.organizationId,
      tradeId: tradeId ?? undefined,
      entityType,
      entityId,
      action,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      source: 'ledger',
      beforeState: before ?? undefined,
      afterState: after ?? undefined,
      correlationId,
      ip: ctx.ip ?? undefined,
    },
    tx,
  );
}

async function enqueue(
  tx: PrismaTransaction,
  ctx: ActorContext,
  eventType: string,
  payload: Record<string, unknown>,
  correlationId: string,
  tradeId?: string | null,
): Promise<void> {
  await outboxRepository.enqueue(
    {
      organizationId: ctx.organizationId,
      tradeId: tradeId ?? null,
      eventType,
      payload: { ...payload, actorId: ctx.actorId, organizationId: ctx.organizationId } as Prisma.InputJsonValue,
      correlationId,
      sequence: 0,
    },
    tx,
  );
}

/** Collapse posting legs into one leg per account (legs to one account share a direction). */
function aggregateLegs(posting: BalancedPosting): Map<string, AggregatedLeg> {
  const byAccount = new Map<string, AggregatedLeg>();
  for (const line of posting.lines) {
    const existing = byAccount.get(line.accountId);
    if (existing) {
      existing.amount = existing.amount.add(line.amount);
      if (!existing.memo && line.memo) existing.memo = line.memo;
    } else {
      byAccount.set(line.accountId, { direction: line.direction, amount: line.amount, memo: line.memo });
    }
  }
  return byAccount;
}

/**
 * Apply a balanced posting atomically inside the caller's transaction. Returns
 * the created transaction. Does NOT flush the outbox — the caller flushes after
 * commit so several postings can share one transaction (e.g. settlement steps).
 */
export async function applyPostingTx(
  tx: PrismaTransaction,
  ctx: ActorContext,
  posting: BalancedPosting,
  meta: PostingMeta,
): Promise<LedgerTransaction> {
  const legs = aggregateLegs(posting);
  const accountIds = [...legs.keys()];

  // Load every referenced account, tenant-scoped, and validate it.
  const accounts = new Map<string, LedgerAccount>();
  for (const accountId of accountIds) {
    const account = await ledgerAccountRepository.findScopedById(accountId, ctx.organizationId, tx);
    if (!account) throw new NotFoundError('LedgerAccount', accountId);
    if (account.status !== 'ACTIVE') {
      throw new ValidationError(`ACCOUNT_NOT_ACTIVE: ${account.code} is ${account.status}`);
    }
    if (account.currency !== posting.currency) {
      throw new ValidationError(`ACCOUNT_CURRENCY_MISMATCH: ${account.code} is ${account.currency}, posting is ${posting.currency}`);
    }
    accounts.set(accountId, account);
  }

  // Compute new balances, enforce funding rules, and advance each balance under lock.
  const newBalances = new Map<string, Money>();
  for (const [accountId, leg] of legs) {
    const account = accounts.get(accountId) as LedgerAccount;
    const normal = account.normalSide as NormalSide;
    const signed = leg.direction === normal ? leg.amount : leg.amount.negate();
    const next = moneyOfAccount(account).add(signed);
    if (!account.allowNegative && next.isNegative()) {
      throw new ValidationError(`INSUFFICIENT_FUNDS: ${account.code} would fall to ${next.toDecimalString()} ${account.currency}`);
    }
    newBalances.set(accountId, next);
    await ledgerAccountRepository.adjustBalanceWithLock(accountId, account.version, next.toDecimalString(), tx);
  }

  // Write the immutable transaction header.
  const transaction = (await ledgerTransactionRepository.create(
    {
      organizationId: ctx.organizationId,
      reference: meta.reference ?? null,
      description: meta.description ?? null,
      status: 'POSTED',
      currency: posting.currency,
      amount: posting.total.toDecimalString(),
      tradeId: meta.tradeId ?? null,
      correlationId: meta.correlationId,
      source: meta.source ?? 'ledger',
      reversalOfId: meta.reversalOfId ?? null,
    },
    tx,
  )) as LedgerTransaction;

  // Write the append-only legs (debits first, then credits — journal order).
  const ordered = [...legs.entries()].sort((a, b) =>
    a[1].direction === b[1].direction ? 0 : a[1].direction === 'DEBIT' ? -1 : 1,
  );
  const entries: LedgerEntryInput[] = ordered.map(([accountId, leg], index) => ({
    transactionId: transaction.id,
    organizationId: ctx.organizationId,
    accountId,
    direction: leg.direction,
    amount: leg.amount.toDecimalString(),
    currency: posting.currency,
    balanceAfter: (newBalances.get(accountId) as Money).toDecimalString(),
    memo: leg.memo ?? null,
    sequence: index,
  }));
  await ledgerEntryRepository.createMany(entries, tx);

  await audit(tx, ctx, 'LedgerTransaction', transaction.id, meta.reversalOfId ? 'REVERSE_POST' : 'POST', null, snapshot(transaction), meta.correlationId, meta.tradeId);
  await enqueue(
    tx,
    ctx,
    'LEDGER_POSTED',
    { transactionId: transaction.id, amount: transaction.amount, currency: posting.currency, legs: entries.length, reversalOfId: meta.reversalOfId ?? null },
    meta.correlationId,
    meta.tradeId,
  );

  return transaction;
}

export const ledgerService = {
  // ── Chart of accounts ──────────────────────────────────────────────────────

  async openAccount(ctx: ActorContext, input: OpenAccountInput): Promise<LedgerAccount> {
    const correlationId = randomUUID();
    const normalSide = input.normalSide ?? ACCOUNT_TYPE_NORMAL[input.type];
    const created = await withTransaction(async (tx) => {
      const existing = await ledgerAccountRepository.findByCode(ctx.organizationId, input.code, tx);
      if (existing) throw new ValidationError(`ACCOUNT_CODE_TAKEN: ${input.code}`);
      const row = await ledgerAccountRepository.create(
        {
          organizationId: ctx.organizationId,
          code: input.code,
          name: input.name,
          type: input.type,
          purpose: input.purpose ?? 'OPERATING',
          normalSide,
          currency: Money.zero(input.currency).currency, // validates currency
          status: 'ACTIVE',
          allowNegative: input.allowNegative ?? false,
          balance: '0',
          ownerOrgId: input.ownerOrgId ?? null,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      );
      await audit(tx, ctx, 'LedgerAccount', row.id, 'CREATE', null, snapshot(row), correlationId);
      await enqueue(tx, ctx, 'LEDGER_ACCOUNT_OPENED', { accountId: row.id, code: row.code, purpose: row.purpose, currency: row.currency }, correlationId);
      return row;
    });
    await flushOutbox();
    return created;
  },

  async setAccountStatus(ctx: ActorContext, id: string, status: 'ACTIVE' | 'FROZEN' | 'CLOSED', reason?: string): Promise<LedgerAccount> {
    const correlationId = randomUUID();
    const updated = await withTransaction(async (tx) => {
      const before = await ledgerAccountRepository.findScopedById(id, ctx.organizationId, tx);
      if (!before) throw new NotFoundError('LedgerAccount', id);
      if (status === 'CLOSED' && !Money.of(before.balance.toString(), before.currency).isZero()) {
        throw new ValidationError('ACCOUNT_NOT_EMPTY: cannot close an account with a non-zero balance');
      }
      const row = await ledgerAccountRepository.setStatus(id, status, tx);
      await audit(tx, ctx, 'LedgerAccount', id, `STATUS_${status}`, snapshot(before), snapshot(row), correlationId);
      await enqueue(tx, ctx, 'LEDGER_ACCOUNT_STATUS_CHANGED', { accountId: id, status, reason: reason ?? null }, correlationId);
      return row;
    });
    await flushOutbox();
    return updated;
  },

  getAccount(ctx: ActorContext, id: string): Promise<LedgerAccount | null> {
    return ledgerAccountRepository.findScopedById(id, ctx.organizationId);
  },

  listAccounts(ctx: ActorContext, filter: LedgerAccountFilter, page: { page: number; pageSize: number }) {
    return ledgerAccountRepository.listScoped(ctx.organizationId, filter, page);
  },

  // ── Postings ─────────────────────────────────────────────────────────────

  /** Post a balanced journal directly. Idempotent on `reference` when supplied. */
  async postJournal(ctx: ActorContext, input: PostJournalInput): Promise<{ transaction: LedgerTransaction; entries: LedgerEntry[] }> {
    if (input.reference) {
      const existing = await ledgerTransactionRepository.findByReference(ctx.organizationId, input.reference);
      if (existing) {
        const entries = await ledgerEntryRepository.listByTransaction(existing.id);
        return { transaction: existing, entries };
      }
    }

    const lines: PostingLine[] = input.lines.map((l) => ({
      accountId: l.accountId,
      direction: l.direction,
      amount: Money.of(l.amount, input.currency),
      memo: l.memo,
    }));
    const posting = buildPosting(lines);
    const correlationId = input.correlationId ?? randomUUID();

    const transaction = await withTransaction((tx) =>
      applyPostingTx(tx, ctx, posting, {
        correlationId,
        reference: input.reference ?? null,
        description: input.description ?? null,
        source: input.source ?? 'ledger',
        tradeId: input.tradeId ?? null,
      }),
    );
    await flushOutbox();
    const entries = await ledgerEntryRepository.listByTransaction(transaction.id);
    return { transaction, entries };
  },

  /** Reverse a posted transaction by writing its mirror image and linking them. */
  async reverseTransaction(ctx: ActorContext, id: string, reason?: string): Promise<{ reversal: LedgerTransaction; entries: LedgerEntry[] }> {
    const correlationId = randomUUID();
    const original = await ledgerTransactionRepository.findScopedById(id, ctx.organizationId);
    if (!original) throw new NotFoundError('LedgerTransaction', id);
    if (original.status !== 'POSTED') throw new ValidationError(`ALREADY_REVERSED: ${id}`);

    const originalEntries = await ledgerEntryRepository.listByTransaction(id);
    const mirrored: PostingLine[] = originalEntries.map((e) => ({
      accountId: e.accountId,
      direction: (e.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT') as EntryDirection,
      amount: Money.of(e.amount.toString(), e.currency),
      memo: `reversal:${id}`,
    }));
    const posting = buildPosting(mirrored);

    const reversal = await withTransaction(async (tx) => {
      const fresh = await ledgerTransactionRepository.findScopedById(id, ctx.organizationId, tx);
      if (!fresh || fresh.status !== 'POSTED') throw new ValidationError(`ALREADY_REVERSED: ${id}`);
      const rev = await applyPostingTx(tx, ctx, posting, {
        correlationId,
        reference: original.reference ? `${original.reference}:reversal` : null,
        description: `Reversal of ${id}${reason ? ` — ${reason}` : ''}`,
        source: 'ledger',
        tradeId: original.tradeId,
        reversalOfId: id,
      });
      await ledgerTransactionRepository.markReversed(id, rev.id, tx);
      await enqueue(tx, ctx, 'LEDGER_REVERSED', { transactionId: id, reversalId: rev.id, reason: reason ?? null }, correlationId, original.tradeId);
      return rev;
    });
    await flushOutbox();
    const entries = await ledgerEntryRepository.listByTransaction(reversal.id);
    return { reversal, entries };
  },

  async getTransaction(ctx: ActorContext, id: string): Promise<{ transaction: LedgerTransaction; entries: LedgerEntry[] }> {
    const transaction = await ledgerTransactionRepository.findScopedById(id, ctx.organizationId);
    if (!transaction) throw new NotFoundError('LedgerTransaction', id);
    const entries = await ledgerEntryRepository.listByTransaction(id);
    return { transaction, entries };
  },

  listTransactions(ctx: ActorContext, filter: LedgerTransactionFilter, page: { page: number; pageSize: number }) {
    return ledgerTransactionRepository.listScoped(ctx.organizationId, filter, page);
  },

  listAccountEntries(ctx: ActorContext, accountId: string, page: { page: number; pageSize: number }) {
    return ledgerEntryRepository.listByAccount(ctx.organizationId, accountId, page);
  },

  /**
   * Trial balance: every live account split into its debit/credit column, with
   * per-currency totals and a `balanced` flag (debits must equal credits). An
   * account whose normal-side balance has gone negative is reported on the
   * opposite column so the totals reconcile.
   */
  async getTrialBalance(ctx: ActorContext, currency?: string) {
    const accounts = await ledgerAccountRepository.listAllScoped(ctx.organizationId, currency);
    const totals = new Map<string, { debit: Money; credit: Money }>();
    const rows = accounts.map((a) => {
      const bal = Money.of(a.balance.toString(), a.currency);
      const onDebitSide = a.normalSide === 'DEBIT' ? !bal.isNegative() : bal.isNegative();
      const magnitude = bal.abs();
      const debit = onDebitSide ? magnitude : Money.zero(a.currency);
      const credit = onDebitSide ? Money.zero(a.currency) : magnitude;
      const acc = totals.get(a.currency) ?? { debit: Money.zero(a.currency), credit: Money.zero(a.currency) };
      acc.debit = acc.debit.add(debit);
      acc.credit = acc.credit.add(credit);
      totals.set(a.currency, acc);
      return {
        accountId: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        purpose: a.purpose,
        normalSide: a.normalSide,
        currency: a.currency,
        balance: bal.toDecimalString(),
        debit: debit.toDecimalString(),
        credit: credit.toDecimalString(),
      };
    });
    const byCurrency = [...totals.entries()].map(([cur, t]) => ({
      currency: cur,
      debit: t.debit.toDecimalString(),
      credit: t.credit.toDecimalString(),
      balanced: t.debit.equals(t.credit),
    }));
    return { accounts: rows, totals: byCurrency };
  },
};
