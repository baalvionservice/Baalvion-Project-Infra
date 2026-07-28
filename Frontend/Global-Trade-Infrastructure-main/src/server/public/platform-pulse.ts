import 'server-only';

/**
 * @file server/public/platform-pulse.ts
 * @description Platform-wide, unscoped aggregate facts for the public homepage.
 * Every value here is an aggregate boolean/count derived across ALL
 * organizations — never a per-tenant row, balance, or identifier. That's what
 * makes it safe to expose to an anonymous visitor: it answers "is the platform
 * healthy / are the books balanced" without revealing anything about any one
 * customer's trade or money position.
 */
import { prisma } from '../db/prisma';
import { ledgerAccountRepository } from '../repositories/ledger-repository';
import { Money } from '../ledger/money';

export interface PlatformPulse {
  /** Raw DB connectivity check — mirrors /api/health's own probe. */
  dbHealthy: boolean;
  /** True iff every currency's debits equal its credits, across all orgs' live ledger accounts. */
  ledgerBalanced: boolean;
  /** Count of live (non-deleted) escrow rows, across all orgs. */
  escrowCount: number;
  /** Count of live (non-deleted) trade transactions, across all orgs. */
  tradeTransactionCount: number;
}

/** Debits === credits per currency, summed across every organization's live accounts. */
async function isLedgerBalancedPlatformWide(): Promise<boolean> {
  const accounts = await ledgerAccountRepository.listAllUnscoped();
  const totals = new Map<string, { debit: Money; credit: Money }>();

  for (const a of accounts) {
    const bal = Money.of(a.balance.toString(), a.currency);
    const onDebitSide = a.normalSide === 'DEBIT' ? !bal.isNegative() : bal.isNegative();
    const magnitude = bal.abs();
    const debit = onDebitSide ? magnitude : Money.zero(a.currency);
    const credit = onDebitSide ? Money.zero(a.currency) : magnitude;
    const acc = totals.get(a.currency) ?? { debit: Money.zero(a.currency), credit: Money.zero(a.currency) };
    acc.debit = acc.debit.add(debit);
    acc.credit = acc.credit.add(credit);
    totals.set(a.currency, acc);
  }

  return [...totals.values()].every((t) => t.debit.equals(t.credit));
}

/**
 * Never throws. This backs the public homepage — a transient DB blip must
 * degrade the pulse tiles individually, never take down the whole page. Every
 * leg has its own fallback: connectivity/integrity checks fall back to false
 * (rendered as "Under Review"/"Degraded"), counts fall back to 0.
 */
export async function getPlatformPulse(): Promise<PlatformPulse> {
  const [dbHealthy, ledgerBalanced, escrowCount, tradeTransactionCount] = await Promise.all([
    prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
    isLedgerBalancedPlatformWide().catch(() => false),
    prisma.escrow.count({ where: { deletedAt: null } }).catch(() => 0),
    prisma.tradeTransaction.count({ where: { deletedAt: null } }).catch(() => 0),
  ]);

  return { dbHealthy, ledgerBalanced, escrowCount, tradeTransactionCount };
}
