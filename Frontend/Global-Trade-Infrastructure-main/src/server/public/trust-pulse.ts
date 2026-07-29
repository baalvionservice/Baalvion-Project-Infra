import 'server-only';

/**
 * @file server/public/trust-pulse.ts
 * @description Platform-wide, unscoped aggregate facts for the public Trust
 * Center (Phase 3) — same governing rule as platform-pulse.ts: every value is
 * an aggregate count/boolean across all organizations, never a per-tenant row.
 * Combines two real sources:
 *   1. This app's own Postgres (organizations, audit events, risk
 *      assessments, compliance checks — none of it tenant-identifying once
 *      reduced to counts).
 *   2. trade-service's independently-verifiable audit hash-chain
 *      (verifyChain() recomputes SHA-256 over every entry; `valid: false`
 *      means tamper detected — see trade-service-client.ts).
 */
import { prisma } from '../db/prisma';
import { fetchTradeServicePlatformStats } from './trade-service-client';

export interface TrustPulse {
  organizationCount: number;
  auditEventCount: number;
  riskAssessmentCount: number;
  complianceCheckCount: number;
  /** null when there are zero compliance checks yet — a 0% rate would be misleading, not honest. */
  compliancePassRate: number | null;
  /** null when trade-service's audit chain couldn't be reached — omit, don't guess. */
  auditChain: { valid: boolean; entries: number | null; headHashPrefix: string | null } | null;
}

/** Never throws — every field degrades independently, same discipline as platform-pulse.ts. */
export async function getTrustPulse(): Promise<TrustPulse> {
  const [organizationCount, auditEventCount, riskAssessmentCount, complianceOutcomes, tradeServiceStats] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }).catch(() => 0),
    prisma.auditLog.count().catch(() => 0),
    prisma.riskAssessment.count().catch(() => 0),
    prisma.complianceCheck.groupBy({ by: ['outcome'], _count: true }).catch(() => []),
    fetchTradeServicePlatformStats(),
  ]);

  const complianceCheckCount = complianceOutcomes.reduce((sum, row) => sum + row._count, 0);
  const passCount = complianceOutcomes.find((row) => row.outcome === 'PASS')?._count ?? 0;
  const compliancePassRate = complianceCheckCount > 0 ? passCount / complianceCheckCount : null;

  const auditChain =
    tradeServiceStats && typeof tradeServiceStats.auditChainValid === 'boolean'
      ? {
          valid: tradeServiceStats.auditChainValid,
          entries: tradeServiceStats.auditChainEntries ?? null,
          headHashPrefix: tradeServiceStats.auditChainHeadHashPrefix ?? null,
        }
      : null;

  return { organizationCount, auditEventCount, riskAssessmentCount, complianceCheckCount, compliancePassRate, auditChain };
}
