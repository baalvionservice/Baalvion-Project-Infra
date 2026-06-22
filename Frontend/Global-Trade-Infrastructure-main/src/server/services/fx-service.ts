/**
 * @file server/services/fx-service.ts
 * @description The FX engine. A quote prices the mid rate with spread + margin
 * into an all-in rate and expires after a TTL. Execution converts a base amount
 * to the quote currency and books it as TWO balanced, single-currency ledger
 * postings — base wallet → FX clearing (base ccy), FX clearing → quote wallet
 * (quote ccy) — so the no-mixed-currency-posting rule holds while the conversion
 * still crosses currencies. Idempotent: a quote executes at most once.
 */
import { randomUUID } from 'crypto';
import { FXQuote, FXTrade, LedgerTransaction } from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import { fxQuoteRepository, fxTradeRepository, walletRepository } from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { auditWrite, enqueueEvent, snapshot } from '../orchestration/write-helpers';
import { applyPostingTx } from './ledger-service';
import { refreshProjectionTx } from './projection-service';
import { getOrCreateTreasuryAccountTx } from './treasury-account-service';
import { priceQuote, convert, isExpired } from '../treasury/fx/fx-math';
import { transfer, buildPosting } from '../ledger/posting';
import { Money, assertCurrency } from '../ledger/money';
import type { ActorContext } from './rule-service';

export type { ActorContext };

const DEFAULT_TTL_SECONDS = 60;

export interface QuoteInput {
  baseCurrency: string;
  quoteCurrency: string;
  midRate: string;
  spreadBps?: number;
  marginBps?: number;
  baseAmount?: string | number;
  ttlSeconds?: number;
  rateSource?: string;
  reference?: string;
}

export interface ExecuteInput {
  quoteId: string;
  fromWalletId: string;
  toWalletId: string;
  baseAmount?: string | number;
  reference?: string;
}

export const fxService = {
  async quote(ctx: ActorContext, input: QuoteInput): Promise<FXQuote> {
    const baseCurrency = assertCurrency(input.baseCurrency);
    const quoteCurrency = assertCurrency(input.quoteCurrency);
    if (baseCurrency === quoteCurrency) throw new ValidationError('SAME_CURRENCY: base and quote currency must differ');

    if (input.reference) {
      const existing = await fxQuoteRepository.findByReference(ctx.organizationId, input.reference);
      if (existing) return existing;
    }

    const pricing = priceQuote(input.midRate, input.spreadBps ?? 0, input.marginBps ?? 0);
    const base = input.baseAmount != null ? Money.of(input.baseAmount, baseCurrency) : null;
    const quoteAmount = base ? convert(base, pricing.allInRate, quoteCurrency) : null;
    const ttlSeconds = input.ttlSeconds ?? DEFAULT_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const correlationId = randomUUID();

    const created = await withTransaction(async (tx) => {
      const row = (await fxQuoteRepository.create(
        {
          organizationId: ctx.organizationId,
          reference: input.reference ?? null,
          baseCurrency,
          quoteCurrency,
          baseAmount: base ? base.toDecimalString() : null,
          midRate: pricing.midRate,
          spreadBps: pricing.spreadBps,
          marginBps: pricing.marginBps,
          allInRate: pricing.allInRate,
          quoteAmount: quoteAmount ? quoteAmount.toDecimalString() : null,
          status: 'QUOTED',
          rateSource: input.rateSource ?? 'internal',
          expiresAt,
          correlationId,
        },
        tx,
      )) as FXQuote;
      await auditWrite(tx, ctx, { source: 'fx', entityType: 'FXQuote', entityId: row.id, action: 'QUOTE', after: snapshot(row), correlationId });
      await enqueueEvent(tx, ctx, { eventType: 'FX_QUOTED', payload: { quoteId: row.id, baseCurrency, quoteCurrency, allInRate: pricing.allInRate }, correlationId });
      return row;
    });
    await flushOutbox();
    return created;
  },

  async execute(ctx: ActorContext, input: ExecuteInput): Promise<{ trade: FXTrade; baseLedgerTxnId: string; quoteLedgerTxnId: string; idempotentReplay: boolean }> {
    const quote = await fxQuoteRepository.findScopedById(input.quoteId, ctx.organizationId);
    if (!quote) throw new NotFoundError('FXQuote', input.quoteId);

    const existingTrade = await fxTradeRepository.findByQuoteId(input.quoteId, ctx.organizationId);
    if (existingTrade) {
      return { trade: existingTrade, baseLedgerTxnId: existingTrade.baseLedgerTxnId, quoteLedgerTxnId: existingTrade.quoteLedgerTxnId, idempotentReplay: true };
    }

    if (quote.status !== 'QUOTED' && quote.status !== 'LOCKED') {
      throw new ValidationError(`QUOTE_NOT_EXECUTABLE: status is ${quote.status}`);
    }
    if (isExpired(Date.now(), quote.expiresAt.getTime())) {
      throw new ValidationError('QUOTE_EXPIRED');
    }

    const baseSource = input.baseAmount ?? (quote.baseAmount ? quote.baseAmount.toString() : null);
    if (baseSource == null) throw new ValidationError('BASE_AMOUNT_REQUIRED: quote had no amount and none supplied');
    const base = Money.of(baseSource, quote.baseCurrency);
    const quoteAmount = convert(base, quote.allInRate.toString(), quote.quoteCurrency);

    const fromWallet = await walletRepository.findScopedById(input.fromWalletId, ctx.organizationId);
    if (!fromWallet) throw new NotFoundError('Wallet', input.fromWalletId);
    const toWallet = await walletRepository.findScopedById(input.toWalletId, ctx.organizationId);
    if (!toWallet) throw new NotFoundError('Wallet', input.toWalletId);
    if (fromWallet.currency !== quote.baseCurrency) throw new ValidationError(`FROM_WALLET_CURRENCY: ${fromWallet.currency} ≠ base ${quote.baseCurrency}`);
    if (toWallet.currency !== quote.quoteCurrency) throw new ValidationError(`TO_WALLET_CURRENCY: ${toWallet.currency} ≠ quote ${quote.quoteCurrency}`);

    const correlationId = randomUUID();
    const result = await withTransaction(async (tx) => {
      const fresh = await fxQuoteRepository.findScopedById(input.quoteId, ctx.organizationId, tx);
      if (!fresh || (fresh.status !== 'QUOTED' && fresh.status !== 'LOCKED')) throw new ValidationError('QUOTE_NOT_EXECUTABLE');

      const fxBase = await getOrCreateTreasuryAccountTx(tx, ctx, 'FX', quote.baseCurrency, correlationId);
      const fxQuoteAcct = await getOrCreateTreasuryAccountTx(tx, ctx, 'FX', quote.quoteCurrency, correlationId);

      // Leg 1 (base ccy): base wallet available → FX clearing.
      const baseTxn: LedgerTransaction = await applyPostingTx(
        tx,
        ctx,
        buildPosting(transfer(fromWallet.availableAccountId, fxBase.ledgerAccountId, base, 'fx.base')),
        { correlationId, reference: input.reference ? `${input.reference}:base` : null, description: `fx.base ${quote.id}`, source: 'fx' },
      );
      // Leg 2 (quote ccy): FX clearing → quote wallet available.
      const quoteTxn: LedgerTransaction = await applyPostingTx(
        tx,
        ctx,
        buildPosting(transfer(fxQuoteAcct.ledgerAccountId, toWallet.availableAccountId, quoteAmount, 'fx.quote')),
        { correlationId, reference: input.reference ? `${input.reference}:quote` : null, description: `fx.quote ${quote.id}`, source: 'fx' },
      );

      const trade = await fxTradeRepository.create(
        {
          organizationId: ctx.organizationId,
          quoteId: quote.id,
          reference: input.reference ?? null,
          baseCurrency: quote.baseCurrency,
          quoteCurrency: quote.quoteCurrency,
          baseAmount: base.toDecimalString(),
          quoteAmount: quoteAmount.toDecimalString(),
          allInRate: quote.allInRate.toString(),
          status: 'EXECUTED',
          baseLedgerTxnId: baseTxn.id,
          quoteLedgerTxnId: quoteTxn.id,
          correlationId,
        },
        tx,
      );

      await fxQuoteRepository.updateWithLock(quote.id, fresh.version, { status: 'EXECUTED', baseAmount: base.toDecimalString(), quoteAmount: quoteAmount.toDecimalString() }, tx);
      await refreshProjectionTx(tx, ctx, fromWallet, new Date());
      await refreshProjectionTx(tx, ctx, toWallet, new Date());

      await auditWrite(tx, ctx, { source: 'fx', entityType: 'FXTrade', entityId: trade.id, action: 'EXECUTE', after: snapshot(trade), correlationId });
      await enqueueEvent(tx, ctx, {
        eventType: 'FX_EXECUTED',
        payload: { tradeId: trade.id, quoteId: quote.id, baseAmount: base.toDecimalString(), quoteAmount: quoteAmount.toDecimalString(), baseLedgerTxnId: baseTxn.id, quoteLedgerTxnId: quoteTxn.id },
        correlationId,
      });
      return { trade, baseLedgerTxnId: baseTxn.id, quoteLedgerTxnId: quoteTxn.id };
    });
    await flushOutbox();
    return { ...result, idempotentReplay: false };
  },

  async getQuote(ctx: ActorContext, id: string): Promise<FXQuote> {
    const quote = await fxQuoteRepository.findScopedById(id, ctx.organizationId);
    if (!quote) throw new NotFoundError('FXQuote', id);
    return quote;
  },

  listQuotes(ctx: ActorContext, filter: { status?: string; baseCurrency?: string; quoteCurrency?: string }, page: { page: number; pageSize: number }) {
    return fxQuoteRepository.listScoped(ctx.organizationId, filter, page);
  },

  listTrades(ctx: ActorContext, filter: { status?: string; quoteId?: string }, page: { page: number; pageSize: number }) {
    return fxTradeRepository.listScoped(ctx.organizationId, filter, page);
  },
};
