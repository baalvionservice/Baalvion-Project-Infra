/**
 * @file server/repositories/analytics-repository.ts
 * @description Org-scoped aggregate queries backing the authenticated
 * Analytics dashboard (Phase 4). Every query is `groupBy`/`count`/`sum`/`avg`
 * — real Prisma aggregation, never a client-side fetch-then-fabricate. Spans
 * multiple models (Order, TradeTransaction, SettlementInstruction,
 * RiskAssessment, ComplianceCheck) so it doesn't fit the single-entity
 * `BaseRepository<T>` shape; same pattern as ledger-repository.ts's multiple
 * specialised repository classes living in one file.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';

export interface TradeVolumeByCurrency {
  currency: string;
  totalAmount: string;
  orderCount: number;
}

export interface TradeStateCount {
  currentState: string;
  count: number;
}

export interface SettlementStatusSummary {
  status: string;
  count: number;
  totalAmount: string;
}

export interface RiskLevelSummary {
  level: string;
  count: number;
  avgScore: number | null;
}

export interface ComplianceOutcomeCount {
  outcome: string;
  count: number;
}

export interface ComplianceTypeCount {
  type: string;
  count: number;
}

export interface CountryVolume {
  country: string;
  count: number;
  totalAmount: string;
}

export const analyticsRepository = {
  async tradeVolumeByCurrency(organizationId: string): Promise<TradeVolumeByCurrency[]> {
    const rows = await prisma.order.groupBy({
      by: ['currency'],
      where: { organizationId, deletedAt: null },
      _sum: { totalAmount: true },
      _count: { _all: true },
    });
    return rows.map((r) => ({
      currency: r.currency,
      totalAmount: (r._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
      orderCount: r._count._all,
    }));
  },

  async tradeStateBreakdown(organizationId: string): Promise<TradeStateCount[]> {
    const rows = await prisma.tradeTransaction.groupBy({
      by: ['currentState'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
    });
    return rows.map((r) => ({ currentState: r.currentState, count: r._count._all }));
  },

  async settlementStatusSummary(organizationId: string): Promise<SettlementStatusSummary[]> {
    const rows = await prisma.settlementInstruction.groupBy({
      by: ['status'],
      where: { organizationId, deletedAt: null },
      _count: { _all: true },
      _sum: { amount: true },
    });
    return rows.map((r) => ({
      status: r.status,
      count: r._count._all,
      totalAmount: (r._sum.amount ?? new Prisma.Decimal(0)).toString(),
    }));
  },

  /**
   * Average settlement cycle time (scheduledAt → updatedAt) for SETTLED
   * instructions, in hours. Computed in JS over a bounded recent sample —
   * Prisma's groupBy can't aggregate a computed duration directly. Returns
   * null when there's no settled instruction with a scheduledAt to diff from.
   */
  async avgSettlementCycleHours(organizationId: string): Promise<number | null> {
    const rows = await prisma.settlementInstruction.findMany({
      where: { organizationId, deletedAt: null, status: 'SETTLED', scheduledAt: { not: null } },
      select: { scheduledAt: true, updatedAt: true },
      take: 500,
      orderBy: { updatedAt: 'desc' },
    });
    if (rows.length === 0) return null;
    const totalMs = rows.reduce((sum, r) => sum + (r.updatedAt.getTime() - r.scheduledAt!.getTime()), 0);
    return totalMs / rows.length / (1000 * 60 * 60);
  },

  async riskExposure(organizationId: string): Promise<RiskLevelSummary[]> {
    const rows = await prisma.riskAssessment.groupBy({
      by: ['level'],
      where: { organizationId },
      _count: { _all: true },
      _avg: { score: true },
    });
    return rows.map((r) => ({ level: r.level, count: r._count._all, avgScore: r._avg.score }));
  },

  async complianceByOutcome(organizationId: string): Promise<ComplianceOutcomeCount[]> {
    const rows = await prisma.complianceCheck.groupBy({
      by: ['outcome'],
      where: { organizationId },
      _count: { _all: true },
    });
    return rows.map((r) => ({ outcome: r.outcome, count: r._count._all }));
  },

  async complianceByType(organizationId: string): Promise<ComplianceTypeCount[]> {
    const rows = await prisma.complianceCheck.groupBy({
      by: ['type'],
      where: { organizationId },
      _count: { _all: true },
    });
    return rows.map((r) => ({ type: r.type, count: r._count._all }));
  },

  /** Top destination countries by order count. Only Order.destinationCountry carries geography — no other model does. */
  async topDestinationCountries(organizationId: string, limit = 10): Promise<CountryVolume[]> {
    const rows = await prisma.order.groupBy({
      by: ['destinationCountry'],
      where: { organizationId, deletedAt: null, destinationCountry: { not: null } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
    return rows
      .map((r) => ({
        country: r.destinationCountry as string,
        count: r._count._all,
        totalAmount: (r._sum.totalAmount ?? new Prisma.Decimal(0)).toString(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
};
