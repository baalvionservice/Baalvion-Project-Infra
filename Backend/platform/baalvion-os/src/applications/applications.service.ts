import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApplicationQueryDto,
  CreateApplicationDto,
  UpdateApplicationStatusDto,
} from './applications.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ApplicationQueryDto) {
    const where: Prisma.JobApplicationWhereInput = {};
    if (query.jobId) where.jobId = query.jobId;
    if (query.status) where.status = query.status;
    return this.prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { job: { select: { id: true, title: true } }, candidate: true },
    });
  }

  async findOne(id: string) {
    const a = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: { job: true, candidate: true },
    });
    if (!a) throw new NotFoundException('Application not found');
    return a;
  }

  create(dto: CreateApplicationDto) {
    return this.prisma.jobApplication.create({ data: dto });
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto) {
    await this.findOne(id);
    return this.prisma.jobApplication.update({ where: { id }, data: { status: dto.status } });
  }
}
