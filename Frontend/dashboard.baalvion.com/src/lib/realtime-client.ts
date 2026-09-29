/**
 * Production-grade Socket.IO client for realtime-service (:3040).
 * Uses the /dashboard namespace. Features: auto-reconnect, heartbeat,
 * typed event system, and JWT token refresh support.
 */

import { io, Socket } from 'socket.io-client';

const WS_URL =
  process.env.NEXT_PUBLIC_REALTIME_WS_URL || 'wss://api.baalvion.com/api/v1/infrastructure/realtime';

// ─── Event types ──────────────────────────────────────────────────────────────
export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export interface KpiUpdate {
  metric: string;
  value: number;
  delta?: number;
  unit?: string;
  timestamp: string;
}

export interface RealtimeAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source?: string;
  timestamp: string;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline' | 'idle';
  lastSeen?: string;
}

export type RealtimeEventMap = {
  notification: RealtimeNotification;
  kpi_update: KpiUpdate;
  alert: RealtimeAlert;
  presence: PresenceUpdate;
  connected: { sessionId: string };
  disconnected: { reason?: string };
  error: { message: string; code?: string };
};

export type RealtimeEventType = keyof RealtimeEventMap;

type Listener<T extends RealtimeEventType> = (
  payload: RealtimeEventMap[T],
) => void;

type AnyListener = (payload: unknown) => void;

/** Custom event types forwarded directly from the socket.io server */
const SERVER_EVENTS: RealtimeEventType[] = [
  'notification',
  'kpi_update',
  'alert',
  'presence',
  'error',
];

// ─── RealtimeClient ───────────────────────────────────────────────────────────
export class RealtimeClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Partial<Record<RealtimeEventType, Set<AnyListener>>> = {};

  /** Whether the socket is currently connected. */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  /** Connect with the given JWT. Attaches to /dashboard namespace. */
  connect(token: string): void {
    if (typeof window === 'undefined') return; // SSR guard

    this.token = token;

    if (this.socket) {
      (this.socket.auth as Record<string, string>).token = token;
      if (!this.socket.connected) this.socket.connect();
      return;
    }

    this.socket = io(`${WS_URL}/dashboard`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      console.info('[RealtimeClient] Connected to /dashboard');
      this._emit('connected', { sessionId: this.socket!.id ?? '' });
    });

    this.socket.on('disconnect', (reason) => {
      console.info('[RealtimeClient] Disconnected:', reason);
      this._emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[RealtimeClient] Connection error:', err.message);
      this._emit('error', { message: err.message });
    });

    // Heartbeat response
    this.socket.on('ping', () => {
      this.socket?.emit('pong');
    });

    // Re-emit missed events sent during reconnect
    this.socket.on('replay', (events: Array<{ type: RealtimeEventType; data: unknown }>) => {
      events.forEach(({ type, data }) => {
        this._emit(type, data as RealtimeEventMap[typeof type]);
      });
    });

    // Forward all server-emitted custom events to local listeners
    for (const event of SERVER_EVENTS) {
      this.socket.on(event, (payload: unknown) => {
        this._emit(event, payload);
      });
    }
  }

  /** Gracefully disconnect and stop reconnecting. */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /** Update the JWT token; bounces the connection to use the new token. */
  updateToken(newToken: string): void {
    this.token = newToken;
    if (this.socket) {
      (this.socket.auth as Record<string, string>).token = newToken;
      this.socket.disconnect().connect();
    }
  }

  // ── Event system ────────────────────────────────────────────────────────────
  on<T extends RealtimeEventType>(event: T, listener: Listener<T>): this {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(listener as AnyListener);
    return this;
  }

  off<T extends RealtimeEventType>(event: T, listener: Listener<T>): this {
    this.listeners[event]?.delete(listener as AnyListener);
    return this;
  }

  private _emit(event: RealtimeEventType, payload: unknown): void {
    this.listeners[event]?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[RealtimeClient] Listener error for "${event}":`, err);
      }
    });
  }
}

/** Singleton client for use across the app. */
export const realtimeClient = new RealtimeClient();
