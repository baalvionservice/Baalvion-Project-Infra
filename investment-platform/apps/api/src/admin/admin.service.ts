import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AccreditationStatus } from '@baalvion-invest/database';

/**
 * Platform-operator views & actions: compliance review queues and approvals.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async kycQueue() {
    return this.prisma.kycCheck.findMany({
      where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async complianceCases() {
    return this.prisma.complianceCase.findMany({
      where: { status: { in: ['OPEN', 'INVESTIGATING', 'ESCALATED'] } },
      orderBy: { openedAt: 'asc' },
    });
  }

  async accreditationQueue() {
    return this.prisma.accreditation.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewAccreditation(
    id: string,
    reviewerUserId: string,
    decision: 'VERIFIED' | 'REJECTED',
  ) {
    const status: AccreditationStatus = decision;
    return this.prisma.accreditation.update({
      where: { id },
      data: {
        status,
        reviewerUserId,
        verifiedAt: decision === 'VERIFIED' ? new Date() : null,
        expiresAt:
          decision === 'VERIFIED'
            ? new Date(Date.now() + 365 * 24 * 3600 * 1000)
            : null,
      },
    });
  }

  async companyReviewQueue() {
    return this.prisma.company.findMany({
      where: { status: 'PENDING_REVIEW' },
      orderBy: { updatedAt: 'asc' },
      include: { profile: true },
    });
  }

  async reviewCompany(companyId: string, approve: boolean) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { status: approve ? 'ACTIVE' : 'SUSPENDED' },
    });
  }

  async metrics() {
    const [investors, companies, deals, invested] = await Promise.all([
      this.prisma.investorProfile.count(),
      this.prisma.company.count(),
      this.prisma.deal.count(),
      this.prisma.investment.aggregate({ _sum: { amount: true } }),
    ]);
    return {
      investors,
      companies,
      deals,
      totalInvested: invested._sum.amount ?? 0,
    };
  }
}
