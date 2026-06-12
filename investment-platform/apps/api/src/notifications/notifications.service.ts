import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, type NotificationChannel } from '@baalvion-invest/database';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Persist an in-app notification (email/SMS dispatch wired in later). */
  async notify(params: {
    userId: string;
    template: string;
    subject?: string;
    payload?: Record<string, unknown>;
    channel?: NotificationChannel;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        channel: params.channel ?? 'IN_APP',
        template: params.template,
        subject: params.subject,
        payloadJson: (params.payload ?? {}) as Prisma.InputJsonValue,
        status: 'SENT',
        sentAt: new Date(),
      },
    });
  }

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: 'READ', readAt: new Date() },
    });
    return { ok: true };
  }
}
