import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { paginated } from '../common/dto/pagination.dto';
import type {
  CreateOpportunityDto,
  DiscoverOpportunitiesDto,
} from './dto/opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, dto: CreateOpportunityDto) {
    const company = await this.prisma.company.findUnique({ where: { orgId } });
    if (!company) throw new ForbiddenException('Only companies can post opportunities');
    return this.prisma.opportunity.create({
      data: {
        companyId: company.id,
        companyOrgId: orgId,
        round: dto.round,
        amountSought: dto.amountSought,
        currency: dto.currency ?? 'USD',
        preMoneyValuation: dto.preMoneyValuation,
        equityOfferedPct: dto.equityOfferedPct,
        securityType: dto.securityType ?? 'EQUITY',
        minTicket: dto.minTicket,
        summary: dto.summary,
        visibility: dto.visibility ?? 'PRIVATE',
        status: 'DRAFT',
      },
    });
  }

  async publish(orgId: string, id: string) {
    await this.requireOwned(orgId, id);
    return this.prisma.opportunity.update({
      where: { id },
      data: { status: 'LIVE' },
    });
  }

  async discover(dto: DiscoverOpportunitiesDto) {
    const where = {
      status: 'LIVE' as const,
      ...(dto.round ? { round: dto.round } : {}),
      ...(dto.country || dto.industry
        ? {
            company: {
              ...(dto.country ? { country: dto.country.toUpperCase() } : {}),
              ...(dto.industry ? { industryCode: dto.industry } : {}),
            },
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        include: { company: { select: { brandName: true, legalName: true, country: true, industryCode: true } } },
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.opportunity.count({ where }),
    ]);
    return paginated(data, total, dto.page, dto.limit);
  }

  async get(id: string) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id },
      include: { company: { include: { profile: true, founders: true } } },
    });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return opp;
  }

  async mine(orgId: string) {
    return this.prisma.opportunity.findMany({
      where: { companyOrgId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWatchlist(orgId: string, opportunityId: string) {
    return this.prisma.watchlist.upsert({
      where: { investorOrgId_opportunityId: { investorOrgId: orgId, opportunityId } },
      create: { investorOrgId: orgId, opportunityId },
      update: {},
    });
  }

  async watchlist(orgId: string) {
    return this.prisma.watchlist.findMany({ where: { investorOrgId: orgId } });
  }

  private async requireOwned(orgId: string, id: string) {
    const opp = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    if (opp.companyOrgId !== orgId) throw new ForbiddenException();
    return opp;
  }
}
