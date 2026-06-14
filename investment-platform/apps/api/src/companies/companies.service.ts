import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@baalvion-invest/database';
import { PrismaService } from '../common/prisma/prisma.service';
import type {
  CompanyProfileDto,
  FounderDto,
  UpsertCompanyDto,
} from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(orgId: string, dto: UpsertCompanyDto) {
    // Ensure the tenant org is marked as a COMPANY.
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { type: 'COMPANY' },
    });
    return this.prisma.company.upsert({
      where: { orgId },
      create: { orgId, ...dto },
      update: { ...dto },
    });
  }

  async get(orgId: string) {
    const company = await this.prisma.company.findUnique({
      where: { orgId },
      include: { profile: true, founders: true, opportunities: true },
    });
    if (!company) throw new NotFoundException('Company not set up');
    return company;
  }

  async setProfile(orgId: string, dto: CompanyProfileDto) {
    const company = await this.require(orgId);
    const { traction, ...rest } = dto;
    const tractionJson = (traction ?? undefined) as
      | Prisma.InputJsonValue
      | undefined;
    return this.prisma.companyProfile.upsert({
      where: { companyId: company.id },
      create: { companyId: company.id, tractionJson, ...rest },
      update: { tractionJson, ...rest },
    });
  }

  async addFounder(orgId: string, dto: FounderDto) {
    const company = await this.require(orgId);
    return this.prisma.founder.create({
      data: { companyId: company.id, ...dto },
    });
  }

  async submit(orgId: string) {
    const company = await this.require(orgId);
    return this.prisma.company.update({
      where: { id: company.id },
      data: { status: 'PENDING_REVIEW' },
    });
  }

  async capTable(orgId: string) {
    const company = await this.require(orgId);
    const [entries, events] = await Promise.all([
      this.prisma.capTableEntry.findMany({
        where: { companyId: company.id },
        orderBy: { asOf: 'desc' },
      }),
      this.prisma.capTableEvent.findMany({
        where: { companyId: company.id },
        orderBy: { effectiveAt: 'desc' },
      }),
    ]);
    return { entries, events };
  }

  private async require(orgId: string) {
    const company = await this.prisma.company.findUnique({ where: { orgId } });
    if (!company) throw new NotFoundException('Company not set up');
    return company;
  }
}
