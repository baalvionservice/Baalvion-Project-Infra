/**
 * @file server/services/treasury-reporting-service.ts
 * @description Treasury reporting. Every figure is DERIVED on read from the
 * ledger (account balances grouped by purpose), the liquidity engine, FX trades
 * and the wallet projections — there is no separate reporting store to drift.
 */
import { LedgerAccount } from '@prisma/client';
import { ledgerAccountRepository, fxTradeRepository, walletRepository } from '../repositories';
import { Money } from '../ledger/money';
import { liquidityService } from './liquidity-service';
import type { ActorContext } from './rule-service';

export type { ActorContext };

const FEE_PURPOSE = 'FEE_INCOME';
const FX_PURPOSE = 'FX_CLEARING';

interface CurrencyPurposeTotals {
  currency: string;
  byPurpose: Record<string, string>;
  total: string;
}

function groupByCurrency(accounts: LedgerAccount[]): Map<string, LedgerAccount[]> {
  const map = new Map<string, LedgerAccount[]>();
  for (const a of accounts) {
    const list = map.get(a.currency) ?? [];
    list.push(a);
    map.set(a.currency, list);
  }
  return map;
}

export const treasuryReportingService = {
  /** Cash position by currency, broken down by account purpose. */
  async cashPosition(ctx: ActorContext, currency?: string): Promise<CurrencyPurposeTotals[]> {
    const accounts = await ledgerAccountRepository.listAllScoped(ctx.organizationId, currency);
    return [...groupByCurrency(accounts).entries()].map(([cur, list]) => {
      const byPurpose: Record<string, Money> = {};
      let total = Money.zero(cur);
      for (const a of list) {
        const bal = Money.of(a.balance.toString(), cur);
        byPurpose[a.purpose] = (byPurpose[a.purpose] ?? Money.zero(cur)).add(bal);
        total = total.add(bal);
      }
      const purposeStrings: Record<string, string> = {};
      for (const [p, m] of Object.entries(byPurpose)) purposeStrings[p] = m.toDecimalString();
      return { currency: cur, byPurpose: purposeStrings, total: total.toDecimalString() };
    }).sort((a, b) => a.currency.localeCompare(b.currency));
  },

  /** Fee income per currency (balance of the FEE_INCOME accounts). */
  async feeIncome(ctx: ActorContext): Promise<{ currency: string; feeIncome: string }[]> {
    const accounts = await ledgerAccountRepository.listAllScoped(ctx.organizationId);
    const totals = new Map<string, Money>();
    for (const a of accounts) {
      if (a.purpose !== FEE_PURPOSE) continue;
      const cur = a.currency;
      totals.set(cur, (totals.get(cur) ?? Money.zero(cur)).add(Money.of(a.balance.toString(), cur)));
    }
    return [...totals.entries()].map(([currency, m]) => ({ currency, feeIncome: m.toDecimalString() })).sort((a, b) => a.currency.localeCompare(b.currency));
  },

  /** FX margin per currency (net of the FX clearing accounts). */
  async fxMargin(ctx: ActorContext): Promise<{ currency: string; net: string }[]> {
    const accounts = await ledgerAccountRepository.listAllScoped(ctx.organizationId);
    const totals = new Map<string, Money>();
    for (const a of accounts) {
      if (a.purpose !== FX_PURPOSE) continue;
      const cur = a.currency;
      totals.set(cur, (totals.get(cur) ?? Money.zero(cur)).add(Money.of(a.balance.toString(), cur)));
    }
    return [...totals.entries()].map(([currency, m]) => ({ currency, net: m.toDecimalString() })).sort((a, b) => a.currency.localeCompare(b.currency));
  },

  fxVolume(ctx: ActorContext): Promise<{ baseCurrency: string; volume: string; count: number }[]> {
    return fxTradeRepository.volumeByBaseCurrency(ctx.organizationId);
  },

  /** A consolidated treasury dashboard. */
  async dashboard(ctx: ActorContext): Promise<Record<string, unknown>> {
    const [positions, feeIncome, fxMargin, fxVolume, cashPosition, wallets] = await Promise.all([
      liquidityService.computeAll(ctx),
      this.feeIncome(ctx),
      this.fxMargin(ctx),
      this.fxVolume(ctx),
      this.cashPosition(ctx),
      walletRepository.listScoped(ctx.organizationId, {}, { page: 1, pageSize: 1 }),
    ]);
    return {
      positionsByCurrency: positions,
      cashPosition,
      feeIncomeByCurrency: feeIncome,
      fxMarginByCurrency: fxMargin,
      fxVolumeByBaseCurrency: fxVolume,
      walletCount: wallets.total,
      generatedAt: new Date().toISOString(),
    };
  },
};
