import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface UpdateOrgInput {
  legalName?: string;
  displayName?: string;
  registrationNo?: string;
  country?: string;
}

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async current(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, dto: UpdateOrgInput) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        legalName: dto.legalName,
        displayName: dto.displayName,
        registrationNo: dto.registrationNo,
        country: dto.country?.toUpperCase(),
      },
    });
  }

  async members(orgId: string) {
    return this.prisma.membership.findMany({
      where: { orgId },
      select: {
        role: true,
        status: true,
        user: { select: { id: true, email: true, fullName: true } },
      },
    });
  }
}
