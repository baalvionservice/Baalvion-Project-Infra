import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@baalvion-invest/database';
import { PrismaService } from '../common/prisma/prisma.service';
import { DealsService } from '../deals/deals.service';
import type { SignDto, TermSheetVersionDto } from './dto/investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deals: DealsService,
  ) {}

  /** Propose or counter a term sheet — appends an immutable version. */
  async submitTermSheet(
    orgId: string,
    userId: string,
    dealId: string,
    dto: TermSheetVersionDto,
  ) {
    await this.deals.requireParticipant(orgId, dealId);

    return this.prisma.$transaction(async (tx) => {
      let sheet = await tx.termSheet.findFirst({ where: { dealId } });
      const nextVersion = sheet ? sheet.currentVersion + 1 : 1;

      if (!sheet) {
        sheet = await tx.termSheet.create({
          data: { dealId, currentVersion: 1, status: 'SENT' },
        });
      } else {
        const status = dto.action === 'COUNTER' ? 'COUNTERED' : 'SENT';
        sheet = await tx.termSheet.update({
          where: { id: sheet.id },
          data: { currentVersion: nextVersion, status },
        });
      }

      const version = await tx.termSheetVersion.create({
        data: {
          termSheetId: sheet.id,
          version: nextVersion,
          amount: dto.amount,
          currency: dto.currency ?? 'USD',
          equityPct: dto.equityPct,
          valuation: dto.valuation,
          securityType: dto.securityType ?? 'EQUITY',
          boardRightsJson: (dto.boardRights ?? undefined) as Prisma.InputJsonValue | undefined,
          investorRightsJson: (dto.investorRights ?? undefined) as Prisma.InputJsonValue | undefined,
          exitRightsJson: (dto.exitRights ?? undefined) as Prisma.InputJsonValue | undefined,
          action: dto.action,
          authorUserId: userId,
        },
      });

      await tx.deal.update({
        where: { id: dealId },
        data: { status: 'NEGOTIATING' },
      });

      return { termSheet: sheet, version };
    });
  }

  /** Accept the current term sheet → create a committed Investment + escrow. */
  async acceptTermSheet(orgId: string, dealId: string) {
    const deal = await this.deals.requireParticipant(orgId, dealId);
    const sheet = await this.prisma.termSheet.findFirst({
      where: { dealId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!sheet || sheet.versions.length === 0) {
      throw new BadRequestException('No term sheet to accept');
    }
    const latest = sheet.versions[0];

    return this.prisma.$transaction(async (tx) => {
      await tx.termSheet.update({
        where: { id: sheet.id },
        data: { status: 'ACCEPTED' },
      });
      const investment = await tx.investment.create({
        data: {
          dealId,
          investorOrgId: deal.investorOrgId,
          companyOrgId: deal.companyOrgId,
          amount: latest.amount,
          currency: latest.currency,
          securityType: latest.securityType,
          ownershipPct: latest.equityPct,
          status: 'COMMITTED',
          committedAt: new Date(),
        },
      });
      const escrow = await tx.escrowAccount.create({
        data: {
          dealId,
          provider: 'STRIPE',
          currency: latest.currency,
          status: 'INITIATED',
        },
      });
      await tx.deal.update({
        where: { id: dealId },
        data: { status: 'SIGNING' },
      });
      return { investment, escrow };
    });
  }

  // ── e-signatures ───────────────────────────────────────────────────────────

  async createSignatureEnvelope(
    orgId: string,
    dealId: string,
    documentId?: string,
  ) {
    const deal = await this.deals.requireParticipant(orgId, dealId);
    return this.prisma.signatureEnvelope.create({
      data: {
        dealId,
        documentId,
        provider: 'INTERNAL',
        status: 'SENT',
        parties: {
          create: [
            { userId: deal.leadInvestorUserId ?? orgId, orgId: deal.investorOrgId, order: 1 },
            { userId: deal.companyOrgId, orgId: deal.companyOrgId, order: 2 },
          ],
        },
      },
      include: { parties: true },
    });
  }

  async sign(userId: string, dto: SignDto) {
    const party = await this.prisma.signatureParty.findFirst({
      where: { envelopeId: dto.envelopeId, userId },
    });
    if (!party) throw new NotFoundException('Not a party to this envelope');

    await this.prisma.signatureParty.update({
      where: { id: party.id },
      data: { status: 'SIGNED', signedAt: new Date() },
    });

    const remaining = await this.prisma.signatureParty.count({
      where: { envelopeId: dto.envelopeId, status: { not: 'SIGNED' } },
    });
    if (remaining === 0) {
      await this.prisma.signatureEnvelope.update({
        where: { id: dto.envelopeId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
    return { signed: true, allComplete: remaining === 0 };
  }

  async positions(orgId: string) {
    return this.prisma.position.findMany({
      where: { investorOrgId: orgId },
      orderBy: { openedAt: 'desc' },
    });
  }

  async investments(orgId: string) {
    return this.prisma.investment.findMany({
      where: { investorOrgId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
