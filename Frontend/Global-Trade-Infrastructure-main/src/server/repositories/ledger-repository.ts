/**
 * @file server/repositories/ledger-repository.ts
 * @description Persistence for the settlement ledger: ledger_accounts,
 * ledger_transactions, ledger_entries and settlement_instructions. All rows are
 * tenant-owned (organizationId NOT NULL) and RLS-scoped. Entries are append-only;
 * transactions are immutable except for the reversal-linkage status flip.
 *
 * Nothing outside the repository layer touches Prisma directly.
 */
import {
  LedgerAccount,
  LedgerTransaction,
  LedgerEntry,
  SettlementInstruction,
  Prisma,
} from '@prisma/client';
import { BaseRepository, client } from './base-repository';
import { prisma } from '../db/prisma';
import {
  ModelDelegate,
  PrismaTransaction,
  Paginated,
  PageRequest,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './types';

// ── Accounts ────────────────────────────────────────────────────────────────

export interface LedgerAccountFilter {
  purpose?: string;
  type?: string;
  status?: string;
  currency?: string;
  ownerOrgId?: string;
  search?: string;
}

export class LedgerAccountRepository extends BaseRepository<LedgerAccount> {
  protected readonly entityName = 'LedgerAccount';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<LedgerAccount> {
    return client(tx).ledgerAccount as unknown as ModelDelegate<LedgerAccount>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<LedgerAccount | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }

  findByCode(organizationId: string, code: string, tx?: PrismaTransaction): Promise<LedgerAccount | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, code }) });
  }

  /** Apply a new balance under optimistic lock (atomic with the posting). */
  adjustBalanceWithLock(
    id: string,
    expectedVersion: number,
    newBalance: string,
    tx: PrismaTransaction,
  ): Promise<LedgerAccount> {
    return this.updateWithLock(id, expectedVersion, { balance: newBalance }, tx);
  }

  setStatus(id: string, status: string, tx?: PrismaTransaction): Promise<LedgerAccount> {
    return this.delegate(tx).update({ where: { id }, data: { status, version: { increment: 1 } } });
  }

  async listScoped(
    organizationId: string,
    filter: LedgerAccountFilter,
    req: PageRequest = {},
  ): Promise<Paginated<LedgerAccount>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.LedgerAccountWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.purpose ? { purpose: filter.purpose } : {}),
      ...(filter.type ? { type: filter.type as LedgerAccount['type'] } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.currency ? { currency: filter.currency } : {}),
      ...(filter.ownerOrgId ? { ownerOrgId: filter.ownerOrgId } : {}),
      ...(filter.search
        ? { OR: [{ name: { contains: filter.search, mode: 'insensitive' } }, { code: { contains: filter.search, mode: 'insensitive' } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.ledgerAccount.findMany({ where, orderBy: [{ code: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.ledgerAccount.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  /** All live accounts for a tenant (bounded chart of accounts) — for trial balance. */
  listAllScoped(organizationId: string, currency?: string, tx?: PrismaTransaction): Promise<LedgerAccount[]> {
    return this.delegate(tx).findMany({
      where: this.liveWhere({ organizationId, ...(currency ? { currency } : {}) }),
      orderBy: [{ code: 'asc' }],
    });
  }
}

// ── Transactions (immutable; corrected by reversal) ──────────────────────────

export interface LedgerTransactionFilter {
  status?: string;
  tradeId?: string;
  correlationId?: string;
  currency?: string;
}

export class LedgerTransactionRepository extends BaseRepository<LedgerTransaction> {
  protected readonly entityName = 'LedgerTransaction';
  protected readonly softDeletes = false;
  protected delegate(tx?: PrismaTransaction): ModelDelegate<LedgerTransaction> {
    return client(tx).ledgerTransaction as unknown as ModelDelegate<LedgerTransaction>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<LedgerTransaction | null> {
    return this.delegate(tx).findFirst({ where: { id, organizationId } });
  }

  findByReference(organizationId: string, reference: string, tx?: PrismaTransaction): Promise<LedgerTransaction | null> {
    return this.delegate(tx).findFirst({ where: { organizationId, reference } });
  }

  markReversed(id: string, reversedById: string, tx: PrismaTransaction): Promise<LedgerTransaction> {
    return this.delegate(tx).update({ where: { id }, data: { status: 'REVERSED', reversedById } });
  }

  async listScoped(
    organizationId: string,
    filter: LedgerTransactionFilter,
    req: PageRequest = {},
  ): Promise<Paginated<LedgerTransaction>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.LedgerTransactionWhereInput = {
      organizationId,
      ...(filter.status ? { status: filter.status as LedgerTransaction['status'] } : {}),
      ...(filter.tradeId ? { tradeId: filter.tradeId } : {}),
      ...(filter.correlationId ? { correlationId: filter.correlationId } : {}),
      ...(filter.currency ? { currency: filter.currency } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.ledgerTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.ledgerTransaction.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── Entries (append-only) ────────────────────────────────────────────────────

export type LedgerEntryInput = Omit<Prisma.LedgerEntryUncheckedCreateInput, 'id' | 'createdAt'>;

export class LedgerEntryRepository {
  /** Write all legs of a posting atomically inside the caller's transaction. */
  async createMany(entries: LedgerEntryInput[], tx: PrismaTransaction): Promise<number> {
    if (entries.length === 0) return 0;
    const res = await tx.ledgerEntry.createMany({ data: entries });
    return res.count;
  }

  listByTransaction(transactionId: string, tx?: PrismaTransaction): Promise<LedgerEntry[]> {
    return (tx ?? prisma).ledgerEntry.findMany({ where: { transactionId }, orderBy: { sequence: 'asc' } });
  }

  /** Gross debit/credit totals and entry count for one account (derived flows). */
  async sumByDirection(
    accountId: string,
    tx?: PrismaTransaction,
  ): Promise<{ debit: string; credit: string; count: number }> {
    const grouped = await (tx ?? prisma).ledgerEntry.groupBy({
      by: ['direction'],
      where: { accountId },
      _sum: { amount: true },
      _count: { _all: true },
    });
    let debit = '0';
    let credit = '0';
    let count = 0;
    for (const row of grouped) {
      const sum = row._sum.amount ? row._sum.amount.toString() : '0';
      count += row._count._all;
      if (row.direction === 'DEBIT') debit = sum;
      else credit = sum;
    }
    return { debit, credit, count };
  }

  async listByAccount(
    organizationId: string,
    accountId: string,
    req: PageRequest = {},
  ): Promise<Paginated<LedgerEntry>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.LedgerEntryWhereInput = { organizationId, accountId };
    const [items, total] = await Promise.all([
      prisma.ledgerEntry.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.ledgerEntry.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── Settlement instructions ──────────────────────────────────────────────────

export interface SettlementInstructionFilter {
  status?: string;
  rail?: string;
  tradeId?: string;
  currency?: string;
}

export class SettlementInstructionRepository extends BaseRepository<SettlementInstruction> {
  protected readonly entityName = 'SettlementInstruction';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<SettlementInstruction> {
    return client(tx).settlementInstruction as unknown as ModelDelegate<SettlementInstruction>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<SettlementInstruction | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }

  async listScoped(
    organizationId: string,
    filter: SettlementInstructionFilter,
    req: PageRequest = {},
  ): Promise<Paginated<SettlementInstruction>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.SettlementInstructionWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.status ? { status: filter.status as SettlementInstruction['status'] } : {}),
      ...(filter.rail ? { rail: filter.rail as SettlementInstruction['rail'] } : {}),
      ...(filter.tradeId ? { tradeId: filter.tradeId } : {}),
      ...(filter.currency ? { currency: filter.currency } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.settlementInstruction.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.settlementInstruction.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export const ledgerAccountRepository = new LedgerAccountRepository();
export const ledgerTransactionRepository = new LedgerTransactionRepository();
export const ledgerEntryRepository = new LedgerEntryRepository();
export const settlementInstructionRepository = new SettlementInstructionRepository();
