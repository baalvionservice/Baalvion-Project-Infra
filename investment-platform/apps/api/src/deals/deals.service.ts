import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type {
  AddMemberDto,
  CreateDealDto,
  PostMessageDto,
  UpdateDealStatusDto,
} from './dto/deal.dto';

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Investor expresses interest in an opportunity → opens a private deal. */
  async create(orgId: string, userId: string, dto: CreateDealDto) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id: dto.opportunityId },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');

    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({
        data: {
          opportunityId: opp.id,
          companyOrgId: opp.companyOrgId,
          investorOrgId: orgId,
          leadInvestorUserId: userId,
          currency: opp.currency,
          status: 'OPEN',
        },
      });
      await tx.dealMember.create({
        data: { dealId: deal.id, userId, orgId, role: 'LEAD' },
      });
      await tx.dealMessage.create({
        data: {
          dealId: deal.id,
          senderUserId: userId,
          body: 'Deal opened.',
          isSystem: true,
        },
      });
      return deal;
    });
  }

  async list(orgId: string) {
    return this.prisma.deal.findMany({
      where: { OR: [{ investorOrgId: orgId }, { companyOrgId: orgId }] },
      orderBy: { updatedAt: 'desc' },
      include: { opportunity: { include: { company: { select: { brandName: true, legalName: true } } } } },
    });
  }

  async get(orgId: string, dealId: string) {
    const deal = await this.requireParticipant(orgId, dealId);
    const [members, messages, ndas, termSheets, escrow] = await Promise.all([
      this.prisma.dealMember.findMany({ where: { dealId } }),
      this.prisma.dealMessage.findMany({
        where: { dealId },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
      this.prisma.ndaAgreement.findMany({ where: { dealId } }),
      this.prisma.termSheet.findMany({
        where: { dealId },
        include: { versions: { orderBy: { version: 'desc' } } },
      }),
      this.prisma.escrowAccount.findMany({ where: { dealId } }),
    ]);
    return { deal, members, messages, ndas, termSheets, escrow };
  }

  async messages(orgId: string, dealId: string) {
    await this.requireParticipant(orgId, dealId);
    return this.prisma.dealMessage.findMany({
      where: { dealId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async postMessage(
    orgId: string,
    userId: string,
    dealId: string,
    dto: PostMessageDto,
  ) {
    await this.requireParticipant(orgId, dealId);
    const message = await this.prisma.dealMessage.create({
      data: {
        dealId,
        senderUserId: userId,
        body: dto.body,
        attachmentsJson: dto.attachments ? (dto.attachments as object) : undefined,
      },
    });
    await this.prisma.deal.update({
      where: { id: dealId },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  async addMember(orgId: string, dealId: string, dto: AddMemberDto) {
    await this.requireParticipant(orgId, dealId);
    return this.prisma.dealMember.upsert({
      where: { dealId_userId: { dealId, userId: dto.userId } },
      create: {
        dealId,
        userId: dto.userId,
        orgId: dto.orgId,
        role: dto.role ?? 'PARTICIPANT',
      },
      update: { role: dto.role ?? 'PARTICIPANT' },
    });
  }

  async createNda(orgId: string, dealId: string) {
    await this.requireParticipant(orgId, dealId);
    return this.prisma.ndaAgreement.create({
      data: { dealId, partyOrgId: orgId, status: 'SENT' },
    });
  }

  async updateStatus(orgId: string, dealId: string, dto: UpdateDealStatusDto) {
    await this.requireParticipant(orgId, dealId);
    return this.prisma.deal.update({
      where: { id: dealId },
      data: { status: dto.status },
    });
  }

  /** Used by the WS gateway and HTTP layer alike. */
  async requireParticipant(orgId: string, dealId: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');
    if (deal.investorOrgId !== orgId && deal.companyOrgId !== orgId) {
      throw new ForbiddenException('Not a participant in this deal');
    }
    return deal;
  }
}
