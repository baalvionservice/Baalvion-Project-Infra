/**
 * @file server/repositories/auction-repository.ts
 * @description Persistence for the auction engine: auctions, auction_bids and
 * auction_events. All rows are tenant-owned (organizationId NOT NULL) and
 * RLS-scoped. Bids are no-delete (only `status` flips); events are append-only.
 * Nothing outside the repository layer touches Prisma directly.
 */
import { Auction, AuctionBid, AuctionEvent, Prisma } from '@prisma/client';
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

export interface AuctionFilter {
  status?: string;
  type?: string;
  tradeId?: string;
  currency?: string;
  sellerOrgId?: string;
  search?: string;
}

export type AuctionCreateInput = Omit<Prisma.AuctionUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type AuctionBidCreateInput = Omit<Prisma.AuctionBidUncheckedCreateInput, 'id' | 'placedAt'>;
export type AuctionEventCreateInput = Omit<Prisma.AuctionEventUncheckedCreateInput, 'id' | 'createdAt'>;

// ── Auctions (mutable aggregate) ─────────────────────────────────────────────

export class AuctionRepository extends BaseRepository<Auction> {
  protected readonly entityName = 'Auction';
  protected delegate(tx?: PrismaTransaction): ModelDelegate<Auction> {
    return client(tx).auction as unknown as ModelDelegate<Auction>;
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<Auction | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ id, organizationId }) });
  }

  findByReference(organizationId: string, reference: string, tx?: PrismaTransaction): Promise<Auction | null> {
    return this.delegate(tx).findFirst({ where: this.liveWhere({ organizationId, reference }) });
  }

  /** Live auctions whose close time has passed and that still need closing (sweeper). */
  findDueForClose(organizationId: string, now: Date, limit = 100, tx?: PrismaTransaction): Promise<Auction[]> {
    return this.delegate(tx).findMany({
      where: this.liveWhere({ organizationId, status: 'LIVE', endsAt: { lte: now } }),
      orderBy: { endsAt: 'asc' },
      take: limit,
    });
  }

  async listScoped(
    organizationId: string,
    filter: AuctionFilter,
    req: PageRequest = {},
  ): Promise<Paginated<Auction>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.AuctionWhereInput = {
      deletedAt: null,
      organizationId,
      ...(filter.status ? { status: filter.status as Auction['status'] } : {}),
      ...(filter.type ? { type: filter.type as Auction['type'] } : {}),
      ...(filter.tradeId ? { tradeId: filter.tradeId } : {}),
      ...(filter.currency ? { currency: filter.currency } : {}),
      ...(filter.sellerOrgId ? { sellerOrgId: filter.sellerOrgId } : {}),
      ...(filter.search
        ? { OR: [{ title: { contains: filter.search, mode: 'insensitive' } }, { lotRef: { contains: filter.search, mode: 'insensitive' } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.auction.findMany({ where, orderBy: [{ endsAt: 'asc' }, { createdAt: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.auction.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── Bids (no-delete; status flips) ───────────────────────────────────────────

export class AuctionBidRepository {
  create(input: AuctionBidCreateInput, tx: PrismaTransaction): Promise<AuctionBid> {
    return tx.auctionBid.create({ data: input });
  }

  findScopedById(id: string, organizationId: string, tx?: PrismaTransaction): Promise<AuctionBid | null> {
    return (tx ?? prisma).auctionBid.findFirst({ where: { id, organizationId } });
  }

  findByReference(auctionId: string, reference: string, tx?: PrismaTransaction): Promise<AuctionBid | null> {
    return (tx ?? prisma).auctionBid.findFirst({ where: { auctionId, reference } });
  }

  /** Highest sequence so far for an auction (0 when none) — for the next bid's order. */
  async maxSequence(auctionId: string, tx?: PrismaTransaction): Promise<number> {
    const top = await (tx ?? prisma).auctionBid.findFirst({
      where: { auctionId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    return top?.sequence ?? 0;
  }

  setStatus(id: string, status: AuctionBid['status'], tx: PrismaTransaction): Promise<AuctionBid> {
    return tx.auctionBid.update({ where: { id }, data: { status } });
  }

  /** Mark all of an auction's still-standing bids LOST, except the winner (set WON). */
  async finalizeStatuses(
    auctionId: string,
    winnerBidId: string | null,
    tx: PrismaTransaction,
  ): Promise<void> {
    await tx.auctionBid.updateMany({
      where: { auctionId, status: { in: ['ACCEPTED', 'WINNING', 'OUTBID'] }, ...(winnerBidId ? { id: { not: winnerBidId } } : {}) },
      data: { status: 'LOST' },
    });
    if (winnerBidId) {
      await tx.auctionBid.update({ where: { id: winnerBidId }, data: { status: 'WON' } });
    }
  }

  async listByAuction(
    organizationId: string,
    auctionId: string,
    req: PageRequest = {},
  ): Promise<Paginated<AuctionBid>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.AuctionBidWhereInput = { organizationId, auctionId };
    const [items, total] = await Promise.all([
      prisma.auctionBid.findMany({ where, orderBy: { sequence: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.auctionBid.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

// ── Events (append-only forensic log) ────────────────────────────────────────

export class AuctionEventRepository {
  create(input: AuctionEventCreateInput, tx: PrismaTransaction): Promise<AuctionEvent> {
    return tx.auctionEvent.create({ data: input });
  }

  async maxSequence(auctionId: string, tx?: PrismaTransaction): Promise<number> {
    const top = await (tx ?? prisma).auctionEvent.findFirst({
      where: { auctionId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    return top?.sequence ?? 0;
  }

  async listByAuction(
    organizationId: string,
    auctionId: string,
    req: PageRequest = {},
  ): Promise<Paginated<AuctionEvent>> {
    const page = Math.max(1, req.page ?? 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, req.pageSize ?? DEFAULT_PAGE_SIZE));
    const where: Prisma.AuctionEventWhereInput = { organizationId, auctionId };
    const [items, total] = await Promise.all([
      prisma.auctionEvent.findMany({ where, orderBy: { sequence: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.auctionEvent.count({ where }),
    ]);
    return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}

export const auctionRepository = new AuctionRepository();
export const auctionBidRepository = new AuctionBidRepository();
export const auctionEventRepository = new AuctionEventRepository();
