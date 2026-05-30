"use client";

// Lightweight singleton WebSocket client for real-time chat.
// Connects to the law-service /ws endpoint with the in-memory access token,
// auto-reconnects with backoff, and lets components subscribe to events.
import { getToken } from "@/lib/api/client";

type Handler = (payload: any) => void;

function wsUrl(): string | null {
  if (typeof window === "undefined") return null;
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;
  // Derive from the REST base origin (…/api/v1/knowledge/law/v1 → origin/ws).
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  try {
    const u = new URL(base, window.location.origin);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.host}/ws`;
  } catch {
    return null;
  }
}

class RealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private reconnectAttempts = 0;
  private connecting = false;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private closedByUs = false;

  on(event: string, cb: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(cb);
    this.connect();
    return () => this.off(event, cb);
  }

  off(event: string, cb: Handler) {
    this.handlers.get(event)?.delete(cb);
  }

  private emit(event: string, payload: any) {
    this.handlers.get(event)?.forEach((cb) => { try { cb(payload); } catch { /* noop */ } });
  }

  send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  connect() {
    if (typeof window === "undefined") return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    if (this.connecting) return;
    const token = getToken();
    const url = wsUrl();
    if (!token || !url) return; // no session yet — caller retries on next subscribe

    this.connecting = true;
    this.closedByUs = false;
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
    } catch {
      this.connecting = false;
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.connecting = false;
      this.reconnectAttempts = 0;
      this.emit("open", null);
      if (this.heartbeat) clearInterval(this.heartbeat);
      this.heartbeat = setInterval(() => this.send({ type: "ping" }), 25_000);
    };
    ws.onmessage = (ev) => {
      let data: any;
      try { data = JSON.parse(ev.data); } catch { return; }
      if (data?.type) this.emit(data.type, data);
    };
    ws.onclose = () => {
      this.connecting = false;
      if (this.heartbeat) { clearInterval(this.heartbeat); this.heartbeat = null; }
      this.ws = null;
      if (!this.closedByUs && this.handlers.size) {
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15_000);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
      }
    };
    ws.onerror = () => { try { ws.close(); } catch { /* noop */ } };
  }

  disconnect() {
    this.closedByUs = true;
    if (this.heartbeat) { clearInterval(this.heartbeat); this.heartbeat = null; }
    try { this.ws?.close(); } catch { /* noop */ }
    this.ws = null;
  }
}

let _client: RealtimeClient | null = null;
export function realtime(): RealtimeClient {
  if (!_client) _client = new RealtimeClient();
  return _client;
}
