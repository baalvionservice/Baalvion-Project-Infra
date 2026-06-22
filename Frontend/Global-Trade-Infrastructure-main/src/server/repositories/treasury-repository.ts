/**
 * @file server/repositories/treasury-repository.ts
 * @description Persistence for the treasury engine: treasury_accounts, wallets,
 * wallet_projections, fx_quotes, fx_trades, liquidity_positions, fee_rules and
 * fee_transactions. All rows are tenant-owned and RLS-scoped. Projections are a
 * mutable cache (upsert); liquidity/fx-trade/fee-transaction rows are append-only.
 *
 * Nothing outside the repository layer touches Prisma directly.
 */
import {
  TreasuryAccount,
  Wallet,
  WalletProjection,
  FXQuote,
  FXTrade,
  LiquidityPosition,
  FeeRule,
  FeeTransaction,
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

function db(tx?: PrismaTransaction) {
  return tx ?? prisma;
}

function paginate(req: PageRequest): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, req.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

// ── Treasury accounts ────────────────────────────────────────────────────────

export class TreasuryAccountRepository extends BaseRepository<TreasuryAccount> {
  protected readonly entityName = 'TreasuryAccount';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<TreasuryAccount> {
    return client(tx).treasuryAccount as unknown as ModelDelegate<TreasuryAccount>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<TreasuryAccount | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }

  findByKindCurrency(organizationId: string, kind: string, currency: string, tx?: PrismaTransaction): Promise<TreasuryAccount | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, kind, currency }) });
  }

  listScoped(organizationId: string, filter: { kind?: string; currency?: string }, tx?: PrismaTransaction): Promise<TreasuryAccount[]> {
    return this.delegate(tx).findMany({
      where: this.liveWhere({ organizationId, ...(filter.kind ? { kind: filter.kind } : {}), ...(filter.currency ? { currency: filter.currency } : {}) }),
      orderBy: [{ kind: 'asc' }, { currency: 'asc' }],
    });
  }
}

// ── Wallets ──────────────────────────────────────────────────────────────────

export interface WalletFilter {
  type?: string;
  currency?: string;
  ownerOrgId?: string;
  status?: string;
}

export class WalletRepository extends BaseRepository<Wallet> {
  protected readonly entityName = 'Wallet';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<Wallet> {
    return client(tx).wallet as unknown as ModelDelegate<Wallet>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<Wallet | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }

  findByReference(organizationId: string, reference: string, tx?: PrismaTransaction): Promise<Wallet | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, reference }) });
  }

  setStatus(id: string, status: string, tx?: PrismaTransaction): Promise<Wallet> {
    return this.delegate(tx).update({ where: { id }, data: { status, version: { increment: 1 } } });
  }

  async listScoped(organizationId: string, filter: WalletFilter, req: PageRequest = {}): Promise<Paginated<Wallet>> {
    const { page, pageSize, skip } = paginate(req);
    const where: Prisma.WalletWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.type ? { type: filter.type as Wallet['type'] } : {}),
      ...(filter.currency ? { currency: filter.currency } : {}),
      ...(filter.ownerOrgId ? { ownerOrgId: filter.ownerOrgId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.wallet.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.wallet.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── Wallet projections (mutable cache, upsert) ───────────────────────────────

export type WalletProjectionInput = Omit<Prisma.WalletProjectionUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'version'>;

export class WalletProjectionRepository {
  findByWalletId(walletId: string, tx?: PrismaTransaction): Promise<WalletProjection | null> {
    return db(tx).walletProjection.findUnique({ where: { walletId } });
  }

  upsert(input: WalletProjectionInput, tx?: PrismaTransaction): Promise<WalletProjection> {
    const { walletId, ...rest } = input;
    return db(tx).walletProjection.upsert({
      where: { walletId },
      create: { walletId, ...rest },
      update: { ...rest, version: { increment: 1 } },
    });
  }
}

// ── FX quotes ────────────────────────────────────────────────────────────────

export class FXQuoteRepository extends BaseRepository<FXQuote> {
  protected readonly entityName = 'FXQuote';
  protected readonly softDeletes = false;
  protected delegate(tx?: PrismaTransaction): ModelDelegate<FXQuote> {
    return client(tx).fXQuote as unknown as ModelDelegate<FXQuote>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<FXQuote | null> {
    return this.delegate(tx).findFirst({ where: { id, organizationId } });
  }

  findByReference(organizationId: string, reference: string, tx?: PrismaTransaction): Promise<FXQuote | null> {
    return this.delegate(tx).findFirst({ where: { organizationId, reference } });
  }

  async listScoped(organizationId: string, filter: { status?: string; baseCurrency?: string; quoteCurrency?: string }, req: PageRequest = {}): Promise<Paginated<FXQuote>> {
    const { page, pageSize, skip } = paginate(req);
    const where: Prisma.FXQuoteWhereInput = {
      organizationId,
      ...(filter.status ? { status: filter.status as FXQuote['status'] } : {}),
      ...(filter.baseCurrency ? { baseCurrency: filter.baseCurrency } : {}),
      ...(filter.quoteCurrency ? { quoteCurrency: filter.quoteCurrency } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.fXQuote.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.fXQuote.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── FX trades (append-only; status flip allowed) ─────────────────────────────

export class FXTradeRepository {
  create(data: Prisma.FXTradeUncheckedCreateInput, tx?: PrismaTransaction): Promise<FXTrade> {
    return db(tx).fXTrade.create({ data });
  }

  findByQuoteId(quoteId: string, organizationId: string, tx?: PrismaTransaction): Promise<FXTrade | null> {
    return db(tx).fXTrade.findFirst({ where: { quoteId, organizationId } });
  }

  findByReference(organizationId: string, reference: string, tx?: PrismaTransaction): Promise<FXTrade | null> {
    return db(tx).fXTrade.findFirst({ where: { organizationId, reference } });
  }

  markReversed(id: string, tx: PrismaTransaction): Promise<FXTrade> {
    return tx.fXTrade.update({ where: { id }, data: { status: 'REVERSED' } });
  }

  /** Executed-trade volume grouped by base currency (for reporting). */
  async volumeByBaseCurrency(organizationId: string): Promise<{ baseCurrency: string; volume: string; count: number }[]> {
    const grouped = await prisma.fXTrade.groupBy({
      by: ['baseCurrency'],
      where: { organizationId, status: 'EXECUTED' },
      _sum: { baseAmount: true },
      _count: { _all: true },
    });
    return grouped.map((g) => ({ baseCurrency: g.baseCurrency, volume: g._sum.baseAmount ? g._sum.baseAmount.toString() : '0', count: g._count._all }));
  }

  async listScoped(organizationId: string, filter: { status?: string; quoteId?: string }, req: PageRequest = {}): Promise<Paginated<FXTrade>> {
    const { page, pageSize, skip } = paginate(req);
    const where: Prisma.FXTradeWhereInput = {
      organizationId,
      ...(filter.status ? { status: filter.status as FXTrade['status'] } : {}),
      ...(filter.quoteId ? { quoteId: filter.quoteId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.fXTrade.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.fXTrade.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── Liquidity positions (append-only snapshots) ──────────────────────────────

export class LiquidityPositionRepository {
  create(data: Prisma.LiquidityPositionUncheckedCreateInput, tx?: PrismaTransaction): Promise<LiquidityPosition> {
    return db(tx).liquidityPosition.create({ data });
  }

  latest(organizationId: string, currency: string, tx?: PrismaTransaction): Promise<LiquidityPosition | null> {
    return db(tx).liquidityPosition.findFirst({ where: { organizationId, currency }, orderBy: { asOf: 'desc' } });
  }

  listScoped(organizationId: string, currency?: string): Promise<LiquidityPosition[]> {
    return prisma.liquidityPosition.findMany({
      where: { organizationId, ...(currency ? { currency } : {}) },
      orderBy: { asOf: 'desc' },
      take: MAX_PAGE_SIZE,
    });
  }
}

// ── Fee rules ────────────────────────────────────────────────────────────────

export class FeeRuleRepository extends BaseRepository<FeeRule> {
  protected readonly entityName = 'FeeRule';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<FeeRule> {
    return client(tx).feeRule as unknown as ModelDelegate<FeeRule>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<FeeRule | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }

  findByCode(organizationId: string, code: string, tx?: PrismaTransaction): Promise<FeeRule | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, code }) });
  }

  async listScoped(organizationId: string, filter: { scope?: string; currency?: string; status?: string }, req: PageRequest = {}): Promise<Paginated<FeeRule>> {
    const { page, pageSize, skip } = paginate(req);
    const where: Prisma.FeeRuleWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.scope ? { scope: filter.scope } : {}),
      ...(filter.currency ? { currency: filter.currency } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.feeRule.findMany({ where, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], skip, take: pageSize }),
      prisma.feeRule.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── Fee transactions (append-only) ───────────────────────────────────────────

export class FeeTransactionRepository {
  create(data: Prisma.FeeTransactionUncheckedCreateInput, tx?: PrismaTransaction): Promise<FeeTransaction> {
    return db(tx).feeTransaction.create({ data });
  }

  findByReference(organizationId: string, reference: string, tx?: PrismaTransaction): Promise<FeeTransaction | null> {
    return db(tx).feeTransaction.findFirst({ where: { organizationId, reference } });
  }

  async listScoped(organizationId: string, filter: { scope?: string; feeRuleId?: string }, req: PageRequest = {}): Promise<Paginated<FeeTransaction>> {
    const { page, pageSize, skip } = paginate(req);
    const where: Prisma.FeeTransactionWhereInput = {
      organizationId,
      ...(filter.scope ? { scope: filter.scope } : {}),
      ...(filter.feeRuleId ? { feeRuleId: filter.feeRuleId } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.feeTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.feeTransaction.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export const treasuryAccountRepository = new TreasuryAccountRepository();
export const walletRepository = new WalletRepository();
export const walletProjectionRepository = new WalletProjectionRepository();
export const fxQuoteRepository = new FXQuoteRepository();
export const fxTradeRepository = new FXTradeRepository();
export const liquidityPositionRepository = new LiquidityPositionRepository();
export const feeRuleRepository = new FeeRuleRepository();
export const feeTransactionRepository = new FeeTransactionRepository();
