import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateConversationDto, CreateMessageDto } from './messaging.dto';

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  createConversation(dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: { participants: dto.participants ?? [], subject: dto.subject ?? null },
    });
  }

  listConversationsFor(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { has: userId } },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(dto: CreateMessageDto) {
    const msg = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        senderId: dto.senderId,
        body: dto.text ?? null,
        attachmentKey: dto.attachmentKey ?? null,
        readBy: [dto.senderId],
      },
    });
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: new Date() },
    });
    // realtime fan-out to everyone subscribed to this conversation (replaces Firestore onSnapshot)
    this.realtime.emit(`conversation:${dto.conversationId}`, 'message', msg);
    return msg;
  }
}
