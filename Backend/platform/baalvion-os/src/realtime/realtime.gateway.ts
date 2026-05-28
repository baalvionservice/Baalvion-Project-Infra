import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';

/**
 * WebSocket fan-out gateway — replaces Firestore realtime listeners.
 * Clients join rooms (e.g. `conversation:<id>`, `user:<id>`); other modules
 * push events via RealtimeService. A Redis adapter is attached when REDIS_URL
 * is set so this scales across instances (Redis pub/sub).
 */
@WebSocketGateway({ path: '/ws', cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayInit {
  private readonly log = new Logger(RealtimeGateway.name);
  @WebSocketServer() server: Server;

  async afterInit(server: Server) {
    const url = process.env.REDIS_URL;
    if (!url) return;
    try {
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const { default: Redis } = await import('ioredis');
      const pub = new Redis(url);
      const sub = pub.duplicate();
      server.adapter(createAdapter(pub, sub));
      this.log.log('Realtime: Redis adapter attached');
    } catch (err: any) {
      this.log.warn(`Realtime: Redis adapter unavailable (${err?.message}); single-node mode`);
    }
  }

  @SubscribeMessage('subscribe')
  onSubscribe(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    if (typeof room === 'string' && room) client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('unsubscribe')
  onUnsubscribe(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    if (typeof room === 'string' && room) client.leave(room);
    return { ok: true, room };
  }
}
