import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto, JobQueryDto, UpdateJobDto } from './dto/job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: JobQueryDto) {
    const where: Prisma.JobWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.job.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  create(dto: CreateJobDto, createdById?: string) {
    return this.prisma.job.create({
      data: {
        ...dto,
        createdById: createdById ?? null,
        publishedAt: dto.status === 'open' ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdateJobDto) {
    await this.findOne(id);
    return this.prisma.job.update({ where: { id }, data: { ...dto } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.job.delete({ where: { id } });
    return { deleted: true };
  }
}
