/**
 * @file server/services/auction-service.ts
 * @description The auction engine application service. A bid is evaluated by the
 * pure proxy-bidding engine, then the standing price, leader, anti-snipe close
 * time, an immutable bid row and an append-only event are all committed in ONE
 * transaction under the auction's optimistic lock — so two bids racing on the
 * same version cannot both win, and a crash can never leave the price advanced
 * without its audit trail. Closing selects the winner (reserve-gated); settling
 * posts the winning amount to the immutable ledger via a settlement instruction.
 */
import { randomUUID } from 'crypto';
import { Prisma, Auction, AuctionBid, AuctionEvent, AuditLog } from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import {
  auctionRepository,
  auctionBidRepository,
  auctionEventRepository,
  auditRepository,
  outboxRepository,
  AuctionFilter,
} from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { Money } from '../ledger/money';
import {
  evaluateBid,
  applyAntiSnipe,
  planClose,
  type AuctionPricingState,
  type BidOutcome,
} from '../auction/auction-engine';
import { settlementService } from './settlement-service';
import type { ActorContext } from './rule-service';
import { CreateAuctionInput, PlaceBidInput, AuctionActionInput } from '../auction/schemas';
import type { CreateSettlementInput } from '../ledger/schemas';

const ACTIVE_BID_STATUSES = new Set(['DRAFT', 'SCHEDULED', 'LIVE']);
const TERMINAL_STATUSES = new Set(['SETTLED', 'FAILED', 'CANCELLED']);

function snapshot<T>(row: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function money(amount: Prisma.Decimal | string | number, currency: string): Money {
  return Money.of(amount.toString(), currency);
}

function moneyOrNull(amount: Prisma.Decimal | null, currency: string): Money | null {
  return amount === null || amount === undefined ? null : Money.of(amount.toString(), currency);
}

/** A small append-only event writer that keeps per-auction sequence monotonic. */
function eventWriter(ctx: ActorContext, auction: Auction, startSeq: number, correlationId: string) {
  let seq = startSeq;
  return async (
    tx: Prisma.TransactionClient,
    type: string,
    fields: Partial<{
      bidId: string;
      amount: string;
      priceBefore: string;
      priceAfter: string;
      data: Prisma.InputJsonValue;
    }> = {},
  ): Promise<AuctionEvent> => {
    seq += 1;
    return auctionEventRepository.create(
      {
        organizationId: ctx.organizationId,
        auctionId: auction.id,
        sequence: seq,
        type,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        currency: auction.currency,
        correlationId,
        ...fields,
      },
      tx,
    );
  };
}

export interface PlaceBidResult {
  auction: Auction;
  bid: AuctionBid;
  outcome: BidOutcome;
  extended: boolean;
}

export interface AuctionTransitionResult {
  auction: Auction;
  settlementId: string | null;
}

export const auctionService = {
  // ── Create ─────────────────────────────────────────────────────────────────
  async createAuction(ctx: ActorContext, input: CreateAuctionInput): Promise<Auction> {
    const currency = Money.zero(input.currency).currency; // validates currency
    const startPrice = money(input.startPrice, currency);
    const bidIncrement = input.bidIncrement ? money(input.bidIncrement, currency) : Money.of('1', currency);
    const reservePrice = input.reservePrice ? money(input.reservePrice, currency) : null;
    if (!bidIncrement.isPositive()) throw new ValidationError('INVALID_INCREMENT: bid increment must be positive');
    if (startPrice.isNegative()) throw new ValidationError('INVALID_START_PRICE: start price cannot be negative');
    if (reservePrice && reservePrice.lt(startPrice)) {
      throw new ValidationError('INVALID_RESERVE: reserve price cannot be below the start price');
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt.getTime() <= startsAt.getTime()) throw new ValidationError('INVALID_WINDOW: endsAt must be after startsAt');

    if (input.reference) {
      const existing = await auctionRepository.findByReference(ctx.organizationId, input.reference);
      if (existing) return existing; // idempotent create
    }

    const openNow = Boolean(input.autoOpen) && startsAt.getTime() <= Date.now();
    const correlationId = randomUUID();

    const created = await withTransaction(async (tx) => {
      const row = (await auctionRepository.create(
        {
          organizationId: ctx.organizationId,
          reference: input.reference ?? null,
          type: input.type ?? 'ENGLISH',
          status: openNow ? 'LIVE' : 'SCHEDULED',
          title: input.title,
          lotRef: input.lotRef ?? null,
          tradeId: input.tradeId ?? null,
          sellerOrgId: input.sellerOrgId ?? null,
          sellerRef: input.sellerRef ?? null,
          currency,
          startPrice: startPrice.toDecimalString(),
          reservePrice: reservePrice ? reservePrice.toDecimalString() : null,
          bidIncrement: bidIncrement.toDecimalString(),
          buyNowPrice: input.buyNowPrice ? money(input.buyNowPrice, currency).toDecimalString() : null,
          currentPrice: '0',
          startsAt,
          endsAt,
          originalEndsAt: endsAt,
          antiSnipeSeconds: input.antiSnipeSeconds ?? 0,
          antiSnipeThreshold: input.antiSnipeThreshold ?? 0,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      )) as Auction;

      const writeEvent = eventWriter(ctx, row, 0, correlationId);
      await writeEvent(tx, 'CREATED', { data: { status: row.status } as Prisma.InputJsonValue });
      if (openNow) await writeEvent(tx, 'OPENED');

      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: row.tradeId ?? undefined,
          entityType: 'Auction',
          entityId: row.id,
          action: 'CREATE',
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'auction',
          afterState: snapshot(row),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: row.tradeId ?? null,
          eventType: 'AUCTION_CREATED',
          payload: { auctionId: row.id, status: row.status, currency, startPrice: row.startPrice, actorId: ctx.actorId } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );
      return row;
    });
    await flushOutbox();
    return created;
  },

  // ── Place bid (the live-bidding core) ────────────────────────────────────────
  async placeBid(ctx: ActorContext, auctionId: string, input: PlaceBidInput): Promise<PlaceBidResult> {
    const correlationId = randomUUID();
    const bidAt = new Date();

    const result = await withTransaction(async (tx) => {
      const auction = await auctionRepository.findScopedById(auctionId, ctx.organizationId, tx);
      if (!auction) throw new NotFoundError('Auction', auctionId);
      if (auction.status !== 'LIVE') throw new ValidationError(`AUCTION_NOT_LIVE: auction is ${auction.status}`);
      if (bidAt.getTime() < auction.startsAt.getTime()) throw new ValidationError('AUCTION_NOT_STARTED');
      if (bidAt.getTime() > auction.endsAt.getTime()) throw new ValidationError('AUCTION_ENDED');

      // Idempotent re-submission: a bid with the same (auction, reference) returns as-is.
      if (input.reference) {
        const existing = await auctionBidRepository.findByReference(auctionId, input.reference, tx);
        if (existing) {
          return {
            auction,
            bid: existing,
            outcome: {
              decision: 'ACCEPTED',
              reason: null,
              newPrice: money(auction.currentPrice, auction.currency),
              newLeaderActorId: auction.leaderActorId,
              newLeaderMaxProxy: moneyOrNull(auction.leaderMaxProxy, auction.currency),
              outbidActorId: null,
              leaderChanged: false,
              proxyRaise: false,
              minNextBid: money(auction.currentPrice, auction.currency).add(money(auction.bidIncrement, auction.currency)),
            } as BidOutcome,
            extended: false,
          };
        }
      }

      const state: AuctionPricingState = {
        currency: auction.currency,
        startPrice: money(auction.startPrice, auction.currency),
        bidIncrement: money(auction.bidIncrement, auction.currency),
        reservePrice: moneyOrNull(auction.reservePrice, auction.currency),
        currentPrice: money(auction.currentPrice, auction.currency),
        bidCount: auction.bidCount,
        leaderActorId: auction.leaderActorId,
        leaderMaxProxy: moneyOrNull(auction.leaderMaxProxy, auction.currency),
      };

      const amount = money(input.amount, auction.currency);
      const maxProxyAmount = input.maxProxyAmount ? money(input.maxProxyAmount, auction.currency) : null;
      const outcome = evaluateBid(state, { bidderActorId: ctx.actorId, amount, maxProxyAmount });

      if (outcome.decision === 'REJECTED') {
        throw new ValidationError(`BID_REJECTED: ${outcome.reason}`);
      }

      // Anti-snipe: a late bid pushes the close time out.
      const snipe = applyAntiSnipe({
        endsAt: auction.endsAt,
        bidAt,
        antiSnipeSeconds: auction.antiSnipeSeconds,
        antiSnipeThresholdSeconds: auction.antiSnipeThreshold,
      });

      const bidSeq = (await auctionBidRepository.maxSequence(auctionId, tx)) + 1;
      const bidIsLeading = outcome.newLeaderActorId === ctx.actorId;
      const bid = await auctionBidRepository.create(
        {
          organizationId: ctx.organizationId,
          auctionId,
          bidderActorId: ctx.actorId,
          bidderOrgId: input.bidderRef ?? null,
          amount: amount.toDecimalString(),
          maxProxyAmount: maxProxyAmount ? maxProxyAmount.toDecimalString() : null,
          currency: auction.currency,
          status: bidIsLeading ? 'WINNING' : 'OUTBID',
          isAutoBid: false,
          sequence: bidSeq,
          reference: input.reference ?? null,
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      );

      // Demote the previous leader's bid when the lead changes hands.
      if (outcome.leaderChanged && auction.currentBidId && outcome.outbidActorId && outcome.outbidActorId !== ctx.actorId) {
        await auctionBidRepository.setStatus(auction.currentBidId, 'OUTBID', tx);
      }

      const newLeaderBidId = outcome.leaderChanged ? bid.id : auction.currentBidId;
      const updated = (await auctionRepository.updateWithLock(
        auctionId,
        auction.version,
        {
          currentPrice: outcome.newPrice.toDecimalString(),
          currentBidId: newLeaderBidId,
          leaderActorId: outcome.newLeaderActorId,
          leaderMaxProxy: outcome.newLeaderMaxProxy ? outcome.newLeaderMaxProxy.toDecimalString() : null,
          bidCount: auction.bidCount + 1,
          endsAt: snipe.extended ? snipe.newEndsAt : auction.endsAt,
          extensionCount: auction.extensionCount + (snipe.extended ? 1 : 0),
        },
        tx,
      )) as Auction;

      // Append-only forensic log: bid, optional proxy raise, anti-snipe, outbid.
      const writeEvent = eventWriter(ctx, auction, await auctionEventRepository.maxSequence(auctionId, tx), correlationId);
      await writeEvent(tx, 'BID_PLACED', {
        bidId: bid.id,
        amount: amount.toDecimalString(),
        priceBefore: auction.currentPrice.toString(),
        priceAfter: outcome.newPrice.toDecimalString(),
      });
      if (outcome.proxyRaise) {
        await writeEvent(tx, 'PROXY_RAISE', { priceBefore: auction.currentPrice.toString(), priceAfter: outcome.newPrice.toDecimalString() });
      }
      if (snipe.extended) {
        await writeEvent(tx, 'ANTI_SNIPE_EXTENDED', { data: { newEndsAt: snipe.newEndsAt.toISOString(), extensionCount: updated.extensionCount } as Prisma.InputJsonValue });
      }
      if (outcome.outbidActorId) {
        await writeEvent(tx, 'BID_OUTBID', { data: { outbidActorId: outcome.outbidActorId, priceAfter: outcome.newPrice.toDecimalString() } as Prisma.InputJsonValue });
      }

      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: auction.tradeId ?? undefined,
          entityType: 'Auction',
          entityId: auctionId,
          action: 'PLACE_BID',
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'auction',
          beforeState: snapshot(auction),
          afterState: snapshot(updated),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: auction.tradeId ?? null,
          eventType: 'AUCTION_BID_PLACED',
          payload: {
            auctionId,
            bidId: bid.id,
            amount: amount.toDecimalString(),
            newPrice: outcome.newPrice.toDecimalString(),
            leaderActorId: outcome.newLeaderActorId,
            outbidActorId: outcome.outbidActorId,
            extended: snipe.extended,
            actorId: ctx.actorId,
          } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );

      return { auction: updated, bid, outcome, extended: snipe.extended };
    });
    await flushOutbox();
    return result;
  },

  // ── Lifecycle transitions: open / close / settle / cancel ────────────────────
  async transition(ctx: ActorContext, auctionId: string, input: AuctionActionInput): Promise<AuctionTransitionResult> {
    if (input.action === 'settle') return this.settle(ctx, auctionId, input);
    const correlationId = randomUUID();

    const result = await withTransaction(async (tx) => {
      const auction = await auctionRepository.findScopedById(auctionId, ctx.organizationId, tx);
      if (!auction) throw new NotFoundError('Auction', auctionId);
      if (TERMINAL_STATUSES.has(auction.status)) throw new ValidationError(`TERMINAL_STATE: auction is ${auction.status}`);

      const writeEvent = eventWriter(ctx, auction, await auctionEventRepository.maxSequence(auctionId, tx), correlationId);
      let data: Record<string, unknown> = {};
      let eventType = '';
      let outboxType = '';

      if (input.action === 'open') {
        if (!ACTIVE_BID_STATUSES.has(auction.status) || auction.status === 'LIVE') {
          throw new ValidationError(`ILLEGAL_TRANSITION: cannot open from ${auction.status}`);
        }
        data = { status: 'LIVE' };
        eventType = 'OPENED';
        outboxType = 'AUCTION_OPENED';
      } else if (input.action === 'close') {
        if (auction.status !== 'LIVE') throw new ValidationError(`ILLEGAL_TRANSITION: cannot close from ${auction.status}`);
        const plan = planClose({
          currency: auction.currency,
          currentPrice: money(auction.currentPrice, auction.currency),
          reservePrice: moneyOrNull(auction.reservePrice, auction.currency),
          bidCount: auction.bidCount,
          leaderActorId: auction.leaderActorId,
          leaderBidId: auction.currentBidId,
        });
        await auctionBidRepository.finalizeStatuses(auctionId, plan.outcome === 'SETTLED' ? plan.winnerBidId : null, tx);
        data =
          plan.outcome === 'SETTLED'
            ? {
                status: 'ENDED',
                winnerBidId: plan.winnerBidId,
                winnerActorId: plan.winnerActorId,
                winningAmount: plan.winningAmount ? plan.winningAmount.toDecimalString() : null,
                closedReason: plan.reason,
              }
            : { status: 'FAILED', closedReason: plan.reason };
        eventType = plan.outcome === 'SETTLED' ? 'WINNER_SELECTED' : 'CLOSED';
        outboxType = plan.outcome === 'SETTLED' ? 'AUCTION_WINNER_SELECTED' : 'AUCTION_FAILED';
        await writeEvent(tx, 'CLOSED', { data: { outcome: plan.outcome, reason: plan.reason } as Prisma.InputJsonValue });
      } else {
        // cancel
        await auctionBidRepository.finalizeStatuses(auctionId, null, tx);
        data = { status: 'CANCELLED', closedReason: input.reason ?? 'cancelled_by_operator' };
        eventType = 'CANCELLED';
        outboxType = 'AUCTION_CANCELLED';
      }

      const updated = (await auctionRepository.updateWithLock(auctionId, auction.version, data, tx)) as Auction;
      await writeEvent(tx, eventType, {
        ...(updated.winningAmount ? { amount: updated.winningAmount.toString() } : {}),
        data: { reason: input.reason ?? updated.closedReason } as Prisma.InputJsonValue,
      });

      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: auction.tradeId ?? undefined,
          entityType: 'Auction',
          entityId: auctionId,
          action: `TRANSITION_${input.action.toUpperCase()}`,
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'auction',
          beforeState: snapshot(auction),
          afterState: snapshot(updated),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: auction.tradeId ?? null,
          eventType: outboxType,
          payload: { auctionId, status: updated.status, winnerActorId: updated.winnerActorId, winningAmount: updated.winningAmount, actorId: ctx.actorId } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );
      return { auction: updated, settlementId: updated.settlementId };
    });
    await flushOutbox();
    return result;
  },

  /**
   * Settle an ended auction: when payer/clearing/payee ledger accounts are
   * supplied, post the winning amount to the immutable ledger via a settlement
   * instruction and link it; otherwise record the financial close logically for
   * a downstream finance flow to pick up.
   */
  async settle(ctx: ActorContext, auctionId: string, input: AuctionActionInput): Promise<AuctionTransitionResult> {
    const auction = await auctionRepository.findScopedById(auctionId, ctx.organizationId);
    if (!auction) throw new NotFoundError('Auction', auctionId);
    if (auction.status === 'SETTLED') return { auction, settlementId: auction.settlementId };
    if (auction.status !== 'ENDED') throw new ValidationError(`ILLEGAL_TRANSITION: cannot settle from ${auction.status}`);
    if (!auction.winnerActorId || !auction.winningAmount) throw new ValidationError('NO_WINNER: auction has no confirmed winner to settle');

    const wantsLedger = Boolean(input.payerAccountId && input.clearingAccountId && input.payeeAccountId);
    let settlementId: string | null = null;
    if (wantsLedger) {
      const instruction = await settlementService.createInstruction(ctx, {
        currency: auction.currency,
        amount: auction.winningAmount.toString(),
        payerAccountId: input.payerAccountId as string,
        clearingAccountId: input.clearingAccountId as string,
        payeeAccountId: input.payeeAccountId as string,
        reference: `auction:${auction.id}`,
        rail: input.settlementRail as CreateSettlementInput['rail'],
        tradeId: auction.tradeId ?? undefined,
      });
      settlementId = instruction.id;
    }

    const correlationId = randomUUID();
    const result = await withTransaction(async (tx) => {
      const updated = (await auctionRepository.updateWithLock(
        auctionId,
        auction.version,
        { status: 'SETTLED', settlementId, settledAt: new Date() },
        tx,
      )) as Auction;
      const writeEvent = eventWriter(ctx, auction, await auctionEventRepository.maxSequence(auctionId, tx), correlationId);
      await writeEvent(tx, 'SETTLED', {
        amount: auction.winningAmount!.toString(),
        data: { settlementId, ledger: wantsLedger } as Prisma.InputJsonValue,
      });
      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: auction.tradeId ?? undefined,
          entityType: 'Auction',
          entityId: auctionId,
          action: 'SETTLE',
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'auction',
          beforeState: snapshot(auction),
          afterState: snapshot(updated),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: auction.tradeId ?? null,
          eventType: 'AUCTION_SETTLED',
          payload: { auctionId, settlementId, winnerActorId: auction.winnerActorId, winningAmount: auction.winningAmount?.toString(), actorId: ctx.actorId } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );
      return { auction: updated, settlementId };
    });
    await flushOutbox();
    return result;
  },

  // ── Reads ────────────────────────────────────────────────────────────────────
  async getAuction(ctx: ActorContext, id: string): Promise<Auction> {
    const auction = await auctionRepository.findScopedById(id, ctx.organizationId);
    if (!auction) throw new NotFoundError('Auction', id);
    return auction;
  },

  listAuctions(ctx: ActorContext, filter: AuctionFilter, page: { page: number; pageSize: number }) {
    return auctionRepository.listScoped(ctx.organizationId, filter, page);
  },

  async listBids(ctx: ActorContext, auctionId: string, page: { page: number; pageSize: number }) {
    await this.getAuction(ctx, auctionId); // tenant assertion
    return auctionBidRepository.listByAuction(ctx.organizationId, auctionId, page);
  },

  async listEvents(ctx: ActorContext, auctionId: string, page: { page: number; pageSize: number }) {
    await this.getAuction(ctx, auctionId);
    return auctionEventRepository.listByAuction(ctx.organizationId, auctionId, page);
  },

  /** Forensic timeline of an auction from the immutable audit trail. */
  getHistory(_ctx: ActorContext, id: string): Promise<AuditLog[]> {
    return auditRepository.listByEntity('Auction', id);
  },
};
