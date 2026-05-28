import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

/** Emit realtime events to a room. Injected by domain services (notifications, chat, …). */
@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  emit(room: string, event: string, payload: unknown) {
    this.gateway.server?.to(room).emit(event, payload);
  }

  toUser(userId: string, event: string, payload: unknown) {
    this.emit(`user:${userId}`, event, payload);
  }
}
