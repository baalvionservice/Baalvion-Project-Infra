import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import type {
  AccreditationDto,
  InvestmentPreferenceDto,
  UpsertInvestorProfileDto,
} from './dto/investor.dto';

@Injectable()
export class InvestorsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(orgId: string, dto: UpsertInvestorProfileDto) {
    return this.prisma.investorProfile.upsert({
      where: { orgId },
      create: { orgId, ...dto },
      update: { ...dto },
    });
  }

  async getProfile(orgId: string) {
    const profile = await this.prisma.investorProfile.findUnique({
      where: { orgId },
      include: { preference: true, accreditations: true },
    });
    if (!profile) throw new NotFoundException('Investor profile not set up');
    return profile;
  }

  async setPreferences(orgId: string, dto: InvestmentPreferenceDto) {
    const profile = await this.requireProfile(orgId);
    return this.prisma.investmentPreference.upsert({
      where: { investorProfileId: profile.id },
      create: { investorProfileId: profile.id, ...dto },
      update: { ...dto },
    });
  }

  async submitAccreditation(orgId: string, dto: AccreditationDto) {
    const profile = await this.requireProfile(orgId);
    return this.prisma.accreditation.create({
      data: {
        investorProfileId: profile.id,
        method: dto.method,
        jurisdiction: dto.jurisdiction.toUpperCase(),
        evidenceDocumentId: dto.evidenceDocumentId,
        status: 'PENDING',
      },
    });
  }

  async listAccreditations(orgId: string) {
    const profile = await this.requireProfile(orgId);
    return this.prisma.accreditation.findMany({
      where: { investorProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async requireProfile(orgId: string) {
    const profile = await this.prisma.investorProfile.findUnique({
      where: { orgId },
    });
    if (!profile) throw new NotFoundException('Investor profile not set up');
    return profile;
  }
}
