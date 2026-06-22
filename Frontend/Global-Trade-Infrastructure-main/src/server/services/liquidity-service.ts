/**
 * @file server/services/liquidity-service.ts
 * @description The liquidity engine. Positions are DERIVED from live ledger
 * account balances grouped by purpose; a snapshot persists an append-only
 * liquidity_positions row. Nothing here holds an authoritative balance.
 */
import { randomUUID } from 'crypto';
import { LedgerAccount, LiquidityPosition } from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { ledgerAccountRepository, liquidityPositionRepository } from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { auditWrite, enqueueEvent, snapshot } from '../orchestration/write-helpers';
import { Money, assertCurrency } from '../ledger/money';
import type { ActorContext } from './rule-service';

export type { ActorContext };

const AVAILABLE_PURPOSES = new Set(['OPERATING', 'LIQUIDITY', 'WALLET_AVAILABLE']);
const RESERVED_PURPOSES = new Set(['RESERVE', 'WALLET_RESERVED']);
const HELD_PURPOSES = new Set(['ESCROW', 'SETTLEMENT', 'WALLET_HELD']);
const PENDING_PURPOSES = new Set(['WALLET_PENDING']);

export interface LiquiditySnapshot {
  currency: string;
  currentPosition: string;
  availableLiquidity: string;
  reserved: string;
  held: string;
  pending: string;
  exposure: string;
  forecast: string;
  reserveRatioBps: number;
  accountCount: number;
}

function computeFromAccounts(accounts: LedgerAccount[], currency: string): LiquiditySnapshot {
  const cur = assertCurrency(currency);
  let available = Money.zero(cur);
  let reserved = Money.zero(cur);
  let held = Money.zero(cur);
  let pending = Money.zero(cur);
  let exposure = Money.zero(cur);

  for (const a of accounts) {
    const bal = Money.of(a.balance.toString(), cur);
    if (AVAILABLE_PURPOSES.has(a.purpose)) available = available.add(bal);
    else if (RESERVED_PURPOSES.has(a.purpose)) reserved = reserved.add(bal);
    else if (HELD_PURPOSES.has(a.purpose)) held = held.add(bal);
    else if (PENDING_PURPOSES.has(a.purpose)) pending = pending.add(bal);
    if (bal.isNegative()) exposure = exposure.add(bal.abs());
  }

  const currentPosition = available.add(reserved).add(held).add(pending);
  const forecast = available.add(pending);
  const reserveRatioBps = currentPosition.isZero()
    ? 0
    : Number((reserved.units * BigInt(10_000)) / currentPosition.units);

  return {
    currency: cur,
    currentPosition: currentPosition.toDecimalString(),
    availableLiquidity: available.toDecimalString(),
    reserved: reserved.toDecimalString(),
    held: held.toDecimalString(),
    pending: pending.toDecimalString(),
    exposure: exposure.toDecimalString(),
    forecast: forecast.toDecimalString(),
    reserveRatioBps,
    accountCount: accounts.length,
  };
}

export const liquidityService = {
  /** Live liquidity position for a currency, derived from the ledger (no write). */
  async computeLive(ctx: ActorContext, currency: string): Promise<LiquiditySnapshot> {
    const accounts = await ledgerAccountRepository.listAllScoped(ctx.organizationId, assertCurrency(currency));
    return computeFromAccounts(accounts, currency);
  },

  /** Live positions across every currency the tenant holds accounts in. */
  async computeAll(ctx: ActorContext): Promise<LiquiditySnapshot[]> {
    const accounts = await ledgerAccountRepository.listAllScoped(ctx.organizationId);
    const byCurrency = new Map<string, LedgerAccount[]>();
    for (const a of accounts) {
      const list = byCurrency.get(a.currency) ?? [];
      list.push(a);
      byCurrency.set(a.currency, list);
    }
    return [...byCurrency.entries()].map(([cur, list]) => computeFromAccounts(list, cur)).sort((a, b) => a.currency.localeCompare(b.currency));
  },

  /** Persist an append-only liquidity snapshot for a currency. */
  async snapshot(ctx: ActorContext, currency: string): Promise<LiquidityPosition> {
    const live = await this.computeLive(ctx, currency);
    const asOf = new Date();
    const correlationId = randomUUID();
    const row = await withTransaction(async (tx) => {
      const position = await liquidityPositionRepository.create(
        {
          organizationId: ctx.organizationId,
          currency: live.currency,
          asOf,
          currentPosition: live.currentPosition,
          availableLiquidity: live.availableLiquidity,
          reserved: live.reserved,
          exposure: live.exposure,
          forecast: live.forecast,
          reserveRatioBps: live.reserveRatioBps,
        },
        tx,
      );
      await auditWrite(tx, ctx, { source: 'liquidity', entityType: 'LiquidityPosition', entityId: position.id, action: 'SNAPSHOT', after: snapshot(position), correlationId });
      await enqueueEvent(tx, ctx, { eventType: 'LIQUIDITY_SNAPSHOT', payload: { currency: live.currency, currentPosition: live.currentPosition, reserveRatioBps: live.reserveRatioBps }, correlationId });
      return position;
    });
    await flushOutbox();
    return row;
  },

  history(ctx: ActorContext, currency?: string): Promise<LiquidityPosition[]> {
    return liquidityPositionRepository.listScoped(ctx.organizationId, currency);
  },
};
