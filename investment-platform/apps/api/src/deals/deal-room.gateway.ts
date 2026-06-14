import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { DealsService } from './deals.service';
import type { JwtAccessPayload } from '../auth/auth.types';

/**
 * Realtime deal-room channel. Clients authenticate with the access token in the
 * socket handshake, then `join` deal rooms they participate in. Messages are
 * persisted via the HTTP layer and fanned out here.
 */
@WebSocketGateway({ namespace: 'deal-room', cors: { origin: true, credentials: true } })
export class DealRoomGateway implements OnGatewayConnection {
  private readonly logger = new Logger(DealRoomGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly deals: DealsService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const token =
        client.handshake.auth?.token ??
        (client.handshake.headers.authorization || '').replace('Bearer ', '');
      const payload = this.jwt.verify<JwtAccessPayload>(token);
      client.data.user = payload;
    } catch {
      client.emit('error', 'unauthorized');
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() dealId: string,
  ): Promise<{ joined: boolean }> {
    const user = client.data.user as JwtAccessPayload | undefined;
    if (!user) throw new UnauthorizedException();
    await this.deals.requireParticipant(user.orgId, dealId);
    await client.join(this.room(dealId));
    return { joined: true };
  }

  /** Called by the HTTP controller after a message is persisted. */
  broadcastMessage(dealId: string, message: unknown): void {
    this.server.to(this.room(dealId)).emit('message', message);
  }

  private room(dealId: string): string {
    return `deal:${dealId}`;
  }
}
