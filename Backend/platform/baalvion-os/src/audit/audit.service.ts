import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  list(limit = 100) {
    return this.prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  }

  log(dto: CreateLogDto, actorId?: string) {
    return this.prisma.systemLog.create({
      data: {
        actorId: actorId ?? null,
        action: dto.action,
        entity: dto.entity ?? null,
        entityId: dto.entityId ?? null,
        ip: dto.ip ?? null,
        meta: dto.meta ?? {},
      },
    });
  }
}
