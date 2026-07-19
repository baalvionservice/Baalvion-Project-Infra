"use client"

/**
 * Socket.IO client for realtime-service's /community namespace — live fan-out for
 * community chat rooms. Sending a message goes through the REST API (lib/api/community.ts,
 * which persists then publishes to Redis for realtime-service to fan out); this client only
 * handles the live receive side: connect, join/leave rooms, listen for chat:message.
 */

import { io, Socket } from 'socket.io-client';

const WS_URL =
  process.env.NEXT_PUBLIC_REALTIME_WS_URL || 'wss://api.baalvion.com/api/v1/infrastructure/realtime';

export interface ChatMessage {
  id: string;
  slug: string;
  userId: string;
  username: string | null;
  content: string;
  createdAt: string;
}

type MessageListener = (message: ChatMessage) => void;
type ConnectionListener = (connected: boolean) => void;

async function fetchSocketToken(): Promise<string> {
  const res = await fetch('/api/realtime-token', { credentials: 'include' });
  if (!res.ok) throw new Error('Not signed in');
  const body = await res.json();
  return body.data.token as string;
}

class CommunityChatClient {
  private socket: Socket | null = null;
  private messageListeners = new Set<MessageListener>();
  private connectionListeners = new Set<ConnectionListener>();
  private connecting: Promise<void> | null = null;

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const token = await fetchSocketToken();

      if (this.socket) {
        (this.socket.auth as Record<string, string>).token = token;
        this.socket.connect();
        return;
      }

      this.socket = io(`${WS_URL}/community`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 15_000,
      });

      this.socket.on('connect', () => this.connectionListeners.forEach((fn) => fn(true)));
      this.socket.on('disconnect', () => this.connectionListeners.forEach((fn) => fn(false)));
      this.socket.on('chat:message', (message: ChatMessage) => {
        this.messageListeners.forEach((fn) => fn(message));
      });
    })();

    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  /** Joins a community room. Resolves once the server confirms, rejects if forbidden. */
  joinRoom(slug: string): Promise<void> {
    const room = `community:${slug}`;
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error('Not connected'));

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Join request timed out'));
      }, 8_000);

      const onJoined = (data: { room: string }) => {
        if (data.room !== room) return;
        cleanup();
        resolve();
      };
      const onError = (data: { code: string; room?: string }) => {
        if (data.room !== room) return;
        cleanup();
        reject(new Error(data.code === 'ROOM_FORBIDDEN' ? 'Not a member of this community' : data.code));
      };
      const cleanup = () => {
        clearTimeout(timeout);
        this.socket?.off('room:joined', onJoined);
        this.socket?.off('error', onError);
      };

      this.socket.on('room:joined', onJoined);
      this.socket.on('error', onError);
      this.socket.emit('join:room', room);
    });
  }

  leaveRoom(slug: string): void {
    this.socket?.emit('leave:room', `community:${slug}`);
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }
}

export const communityChatClient = new CommunityChatClient();
