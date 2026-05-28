import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCandidateDto, UpdateCandidateDto } from './candidates.dto';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.candidate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const c = await this.prisma.candidate.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Candidate not found');
    return c;
  }

  create(dto: CreateCandidateDto) {
    return this.prisma.candidate.create({ data: dto });
  }

  async update(id: string, dto: UpdateCandidateDto) {
    await this.findOne(id);
    return this.prisma.candidate.update({ where: { id }, data: dto });
  }
}
