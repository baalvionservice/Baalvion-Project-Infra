import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateNotificationDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async create(dto: CreateNotificationDto) {
    const n = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body ?? null,
        channel: (dto.channel as NotificationChannel) ?? NotificationChannel.in_app,
        data: dto.data ?? {},
      },
    });
    // realtime push (replaces Firestore onSnapshot)
    this.realtime.toUser(dto.userId, 'notification', n);
    return n;
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
}
