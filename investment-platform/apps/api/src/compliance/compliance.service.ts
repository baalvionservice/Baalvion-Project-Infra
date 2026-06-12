import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SumsubService } from './sumsub.service';
import type { KycStatus, SubjectType } from '@baalvion-invest/database';

/**
 * Maps Sumsub review answers to our KycStatus and keeps both the KYC record
 * and the owning Organization status in sync.
 */
@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sumsub: SumsubService,
  ) {}

  async startKyc(orgId: string, userId: string, subjectType: SubjectType) {
    const externalUserId = subjectType === 'BUSINESS' ? `org_${orgId}` : `usr_${userId}`;
    const applicantId = await this.sumsub.createApplicant(externalUserId);
    const accessToken = await this.sumsub.createAccessToken(externalUserId);

    const kyc = await this.prisma.kycCheck.create({
      data: {
        orgId,
        subjectType,
        subjectUserId: userId,
        provider: 'sumsub',
        applicantId,
        status: 'PENDING',
      },
    });

    return { kycCheckId: kyc.id, applicantId, accessToken, provider: 'sumsub' };
  }

  async status(orgId: string) {
    return this.prisma.kycCheck.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Handle Sumsub `applicantReviewed` webhooks. */
  async handleWebhook(payload: any): Promise<void> {
    const applicantId: string | undefined = payload?.applicantId;
    const reviewAnswer: string | undefined = payload?.reviewResult?.reviewAnswer;
    if (!applicantId) return;

    const status = this.mapStatus(payload?.reviewStatus, reviewAnswer);
    const sanctionsHit = this.flagged(payload, 'SANCTIONS');
    const pepHit = this.flagged(payload, 'PEP');

    const updated = await this.prisma.kycCheck.updateMany({
      where: { applicantId },
      data: {
        status,
        reviewResult: reviewAnswer,
        sanctionsHit,
        pepHit,
        rawPayload: payload,
      },
    });
    if (updated.count === 0) {
      this.logger.warn(`Webhook for unknown applicant ${applicantId}`);
      return;
    }

    // Promote org to ACTIVE once KYC approved; open a case on red flags.
    const kyc = await this.prisma.kycCheck.findFirst({ where: { applicantId } });
    if (!kyc) return;
    if (status === 'APPROVED') {
      await this.prisma.organization.update({
        where: { id: kyc.orgId },
        data: { status: 'ACTIVE' },
      });
    }
    if (sanctionsHit || pepHit) {
      await this.prisma.complianceCase.create({
        data: {
          orgId: kyc.orgId,
          type: sanctionsHit ? 'SANCTIONS_HIT' : 'PEP_REVIEW',
          status: 'OPEN',
          summary: `Auto-opened from Sumsub review of applicant ${applicantId}`,
        },
      });
    }
  }

  private mapStatus(reviewStatus?: string, answer?: string): KycStatus {
    if (reviewStatus && reviewStatus !== 'completed') return 'IN_REVIEW';
    if (answer === 'GREEN') return 'APPROVED';
    if (answer === 'RED') return 'REJECTED';
    return 'IN_REVIEW';
  }

  private flagged(payload: any, label: string): boolean {
    const labels: string[] = payload?.reviewResult?.rejectLabels ?? [];
    return labels.some((l) => l.toUpperCase().includes(label));
  }
}
