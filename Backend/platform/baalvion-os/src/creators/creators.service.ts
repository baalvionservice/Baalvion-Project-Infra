import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCreatorDto, UpdateCreatorDto } from './creators.dto';

@Injectable()
export class CreatorsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.creator.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const c = await this.prisma.creator.findUnique({ where: { id }, include: { portfolio: true } });
    if (!c) throw new NotFoundException('Creator not found');
    return c;
  }

  create(dto: CreateCreatorDto) {
    return this.prisma.creator.create({
      data: { userId: dto.userId, handle: dto.handle, bio: dto.bio, niches: dto.niches ?? [], rateCard: dto.rateCard ?? {} },
    });
  }

  async update(id: string, dto: UpdateCreatorDto) {
    await this.findOne(id);
    return this.prisma.creator.update({ where: { id }, data: { ...dto } });
  }
}
