import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WiseService } from '../payments/wise.service';
import { LedgerService } from '../payments/ledger.service';
import type { PayoutType } from '@baalvion-invest/database';

interface CreateDistributionInput {
  investorOrgId: string;
  investmentId?: string;
  type: PayoutType;
  grossAmount: number;
  taxWithheld?: number;
  currency?: string;
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wise: WiseService,
    private readonly ledger: LedgerService,
  ) {}

  /** Aggregated portfolio: positions valued at latest NAV, with MOIC. */
  async summary(orgId: string) {
    const positions = await this.prisma.position.findMany({
      where: { investorOrgId: orgId },
    });

    const enriched = await Promise.all(
      positions.map(async (p) => {
        const valuation = await this.prisma.valuation.findFirst({
          where: { investmentId: p.investmentId },
          orderBy: { asOf: 'desc' },
        });
        const cost = Number(p.costBasis);
        const current = valuation ? Number(valuation.totalValue) : cost;
        return {
          positionId: p.id,
          companyOrgId: p.companyOrgId,
          securityType: p.securityType,
          shares: Number(p.shares),
          costBasis: cost,
          currentValue: current,
          moic: cost ? Number((current / cost).toFixed(4)) : null,
          currency: p.currency,
        };
      }),
    );

    const totals = enriched.reduce(
      (acc, e) => {
        acc.cost += e.costBasis;
        acc.value += e.currentValue;
        return acc;
      },
      { cost: 0, value: 0 },
    );

    return {
      positions: enriched,
      totals: {
        invested: totals.cost,
        currentValue: totals.value,
        unrealizedGain: totals.value - totals.cost,
        moic: totals.cost ? Number((totals.value / totals.cost).toFixed(4)) : null,
      },
    };
  }

  async returns(orgId: string) {
    return this.prisma.returnSnapshot.findMany({
      where: { investorOrgId: orgId },
      orderBy: { asOf: 'desc' },
    });
  }

  async distributions(orgId: string) {
    return this.prisma.distribution.findMany({
      where: { investorOrgId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** A company pays out to an investor (dividend/return/exit) via Wise. */
  async createDistribution(companyOrgId: string, dto: CreateDistributionInput) {
    const currency = dto.currency ?? 'USD';
    const net = dto.grossAmount - (dto.taxWithheld ?? 0);

    const distribution = await this.prisma.distribution.create({
      data: {
        companyOrgId,
        investorOrgId: dto.investorOrgId,
        investmentId: dto.investmentId,
        type: dto.type,
        grossAmount: dto.grossAmount,
        taxWithheld: dto.taxWithheld ?? 0,
        netAmount: net,
        currency,
        status: 'PROCESSING',
      },
    });

    const payout = await this.wise.createPayout({
      amount: net,
      currency,
      reference: `dist-${distribution.id}`,
    });

    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orgId: companyOrgId,
          provider: 'WISE',
          direction: 'OUTBOUND',
          amount: net,
          currency,
          status: 'PROCESSING',
          externalRef: payout.id,
          idempotencyKey: `dist-${distribution.id}`,
        },
      });
      await tx.distribution.update({
        where: { id: distribution.id },
        data: { paymentId: payment.id },
      });
      await this.ledger.post(tx, {
        orgId: companyOrgId,
        currency,
        refType: 'distribution',
        refId: distribution.id,
        memo: `${dto.type} distribution`,
        legs: [
          { account: 'company:cash', direction: 'DEBIT', amount: net },
          { account: 'investor:payable', direction: 'CREDIT', amount: net },
        ],
      });
    });

    return distribution;
  }

  async taxDocuments(orgId: string) {
    return this.prisma.taxDocument.findMany({
      where: { investorOrgId: orgId },
      orderBy: { taxYear: 'desc' },
    });
  }
}
