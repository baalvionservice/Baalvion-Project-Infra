/**
 * @file server/services/analytics-service.ts
 * @description Shapes analytics-repository.ts's raw aggregates into the
 * Analytics dashboard's response DTO, computing a couple of derived metrics
 * (compliance pass rate, settlement cycle time) the repository layer
 * intentionally leaves as building blocks rather than baking in.
 */
import { analyticsRepository } from '../repositories';
import type { ActorContext } from './rule-service';

export interface AnalyticsOverview {
  tradeVolume: { currency: string; totalAmount: string; orderCount: number }[];
  tradePipeline: { state: string; count: number }[];
  settlement: {
    byStatus: { status: string; count: number; totalAmount: string }[];
    avgCycleHours: number | null;
  };
  risk: {
    byLevel: { level: string; count: number; avgScore: number | null }[];
    totalAssessments: number;
  };
  compliance: {
    byOutcome: { outcome: string; count: number }[];
    byType: { type: string; count: number }[];
    totalChecks: number;
    passRate: number | null;
  };
  topCountries: { country: string; count: number; totalAmount: string }[];
}

export const analyticsService = {
  async overview(ctx: ActorContext): Promise<AnalyticsOverview> {
    const [tradeVolume, stateRows, settlementByStatus, avgCycleHours, riskByLevel, complianceByOutcome, complianceByType, topCountries] =
      await Promise.all([
        analyticsRepository.tradeVolumeByCurrency(ctx.organizationId),
        analyticsRepository.tradeStateBreakdown(ctx.organizationId),
        analyticsRepository.settlementStatusSummary(ctx.organizationId),
        analyticsRepository.avgSettlementCycleHours(ctx.organizationId),
        analyticsRepository.riskExposure(ctx.organizationId),
        analyticsRepository.complianceByOutcome(ctx.organizationId),
        analyticsRepository.complianceByType(ctx.organizationId),
        analyticsRepository.topDestinationCountries(ctx.organizationId),
      ]);

    const totalAssessments = riskByLevel.reduce((sum, r) => sum + r.count, 0);
    const totalChecks = complianceByOutcome.reduce((sum, r) => sum + r.count, 0);
    const passCount = complianceByOutcome.find((r) => r.outcome === 'PASS')?.count ?? 0;
    const passRate = totalChecks > 0 ? passCount / totalChecks : null;

    return {
      tradeVolume,
      tradePipeline: stateRows.map((r) => ({ state: r.currentState, count: r.count })),
      settlement: { byStatus: settlementByStatus, avgCycleHours },
      risk: { byLevel: riskByLevel, totalAssessments },
      compliance: { byOutcome: complianceByOutcome, byType: complianceByType, totalChecks, passRate },
      topCountries,
    };
  },
};
