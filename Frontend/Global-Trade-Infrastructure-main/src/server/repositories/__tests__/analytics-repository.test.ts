/**
 * @file server/repositories/__tests__/analytics-repository.test.ts
 * @description Real-PostgreSQL tests for the Phase 4 Analytics aggregates —
 * proves the groupBy/count/sum/avg queries actually execute correctly and
 * return the right shape, not just that they type-check.
 */
import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { prisma } from '../../db/prisma';
import { analyticsRepository } from '../analytics-repository';

describe('analyticsRepository (PostgreSQL)', () => {
  let orgId: string;
  let tradeId: string;

  beforeEach(async () => {
    await resetDatabase();
    orgId = await seedOrganization();
    const trade = await prisma.tradeTransaction.create({
      data: { organizationId: orgId, reference: 'T-1', correlationId: 'T-1', currentState: 'TRADE_COMPLETED', terms: {} },
    });
    tradeId = trade.id;
  });

  afterAll(async () => {
    await disconnect();
  });

  it('sums trade volume by currency', async () => {
    await prisma.order.createMany({
      data: [
        { organizationId: orgId, totalAmount: '1000.00', currency: 'USD', destinationCountry: 'DE' },
        { organizationId: orgId, totalAmount: '2500.50', currency: 'USD', destinationCountry: 'FR' },
        { organizationId: orgId, totalAmount: '500.00', currency: 'EUR', destinationCountry: 'DE' },
      ],
    });

    const rows = await analyticsRepository.tradeVolumeByCurrency(orgId);
    const usd = rows.find((r) => r.currency === 'USD');
    const eur = rows.find((r) => r.currency === 'EUR');
    expect(usd?.orderCount).toBe(2);
    expect(Number(usd?.totalAmount)).toBeCloseTo(3500.5, 2);
    expect(eur?.orderCount).toBe(1);
  });

  it('breaks trades down by current state', async () => {
    await prisma.tradeTransaction.createMany({
      data: [
        { organizationId: orgId, reference: 'T-2', correlationId: 'T-2', currentState: 'RFQ_CREATED', terms: {} },
        { organizationId: orgId, reference: 'T-3', correlationId: 'T-3', currentState: 'RFQ_CREATED', terms: {} },
      ],
    });

    const rows = await analyticsRepository.tradeStateBreakdown(orgId);
    const rfq = rows.find((r) => r.currentState === 'RFQ_CREATED');
    const completed = rows.find((r) => r.currentState === 'TRADE_COMPLETED');
    expect(rfq?.count).toBe(2);
    expect(completed?.count).toBe(1); // seeded in beforeEach
  });

  it('summarizes settlement instructions by status and computes avg cycle time', async () => {
    const account = () => randomUUID();
    // scheduledAt 3 hours in the past; updatedAt lands at "now" via Prisma's normal
    // @updatedAt stamp on create — so the cycle time this produces is ~3 hours,
    // computed entirely through the real Prisma pipeline (no raw-SQL timestamp hacks
    // that could pick up the test DB's local session timezone instead of UTC).
    const scheduledAt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    await prisma.settlementInstruction.create({
      data: {
        organizationId: orgId,
        status: 'SETTLED',
        amount: '1000.00',
        payerAccountId: account(),
        clearingAccountId: account(),
        payeeAccountId: account(),
        correlationId: 'S-1',
        scheduledAt,
      },
    });
    await prisma.settlementInstruction.create({
      data: {
        organizationId: orgId,
        status: 'CREATED',
        amount: '250.00',
        payerAccountId: account(),
        clearingAccountId: account(),
        payeeAccountId: account(),
        correlationId: 'S-2',
      },
    });

    const byStatus = await analyticsRepository.settlementStatusSummary(orgId);
    const settledSummary = byStatus.find((r) => r.status === 'SETTLED');
    expect(settledSummary?.count).toBe(1);
    expect(Number(settledSummary?.totalAmount)).toBeCloseTo(1000, 2);

    const avgHours = await analyticsRepository.avgSettlementCycleHours(orgId);
    expect(avgHours).toBeCloseTo(3, 1);
  });

  it('returns null avg settlement cycle when nothing is settled yet', async () => {
    const avgHours = await analyticsRepository.avgSettlementCycleHours(orgId);
    expect(avgHours).toBeNull();
  });

  it('exposes risk assessments grouped by level with avg score', async () => {
    await prisma.riskAssessment.createMany({
      data: [
        { organizationId: orgId, tradeTransactionId: tradeId, score: 20, level: 'LOW', factors: {} },
        { organizationId: orgId, tradeTransactionId: tradeId, score: 80, level: 'HIGH', factors: {} },
        { organizationId: orgId, tradeTransactionId: tradeId, score: 90, level: 'HIGH', factors: {} },
      ],
    });

    const rows = await analyticsRepository.riskExposure(orgId);
    const high = rows.find((r) => r.level === 'HIGH');
    expect(high?.count).toBe(2);
    expect(high?.avgScore).toBeCloseTo(85, 1);
  });

  it('breaks compliance checks down by outcome and by type', async () => {
    await prisma.complianceCheck.createMany({
      data: [
        { organizationId: orgId, tradeTransactionId: tradeId, type: 'KYC', outcome: 'PASS', subject: 'buyer', reasons: [] },
        { organizationId: orgId, tradeTransactionId: tradeId, type: 'KYC', outcome: 'PASS', subject: 'seller', reasons: [] },
        { organizationId: orgId, tradeTransactionId: tradeId, type: 'SANCTIONS', outcome: 'FAIL', subject: 'buyer', reasons: [] },
      ],
    });

    const byOutcome = await analyticsRepository.complianceByOutcome(orgId);
    const byType = await analyticsRepository.complianceByType(orgId);
    expect(byOutcome.find((r) => r.outcome === 'PASS')?.count).toBe(2);
    expect(byOutcome.find((r) => r.outcome === 'FAIL')?.count).toBe(1);
    expect(byType.find((r) => r.type === 'KYC')?.count).toBe(2);
    expect(byType.find((r) => r.type === 'SANCTIONS')?.count).toBe(1);
  });

  it('ranks top destination countries by order count', async () => {
    await prisma.order.createMany({
      data: [
        { organizationId: orgId, totalAmount: '100', currency: 'USD', destinationCountry: 'DE' },
        { organizationId: orgId, totalAmount: '200', currency: 'USD', destinationCountry: 'DE' },
        { organizationId: orgId, totalAmount: '300', currency: 'USD', destinationCountry: 'FR' },
        { organizationId: orgId, totalAmount: '400', currency: 'USD' }, // no destination — must be excluded
      ],
    });

    const rows = await analyticsRepository.topDestinationCountries(orgId);
    expect(rows[0]).toMatchObject({ country: 'DE', count: 2 });
    expect(rows.find((r) => r.country === 'FR')?.count).toBe(1);
    expect(rows.some((r) => r.country === null)).toBe(false);
  });
});
