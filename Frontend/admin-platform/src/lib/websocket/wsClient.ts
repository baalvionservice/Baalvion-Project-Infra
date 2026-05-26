import { useRealtimeStore } from '@/lib/store/realtimeStore';
import type { LiveEvent } from '@/lib/types/realtime.types';

const WS_URL          = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3040';
const RECONNECT_DELAY = 3000;
const PING_INTERVAL   = 25_000;

let ws:         WebSocket | null = null;
let pingTimer:  ReturnType<typeof setInterval> | null = null;
let reconTimer: ReturnType<typeof setTimeout>  | null = null;
let stopped = false;

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('baalvion-auth');
    if (!raw) return null;
    const { state } = JSON.parse(raw);
    return state?.accessToken ?? null;
  } catch { return null; }
}

function clearTimers() {
  if (pingTimer)  clearInterval(pingTimer);
  if (reconTimer) clearTimeout(reconTimer);
  pingTimer = reconTimer = null;
}

export function connectWs() {
  if (stopped) return;
  if (typeof window === 'undefined') return;

  const store = useRealtimeStore.getState();
  store.setWsState('connecting');

  const url   = getToken() ? `${WS_URL}?token=${getToken()}` : WS_URL;
  ws = new WebSocket(url);

  ws.onopen = () => {
    store.setWsState('connected');
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    }, PING_INTERVAL);
  };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data as string);
      handleMessage(msg);
    } catch { /* skip bad frames */ }
  };

  ws.onclose = () => {
    clearTimers();
    store.setWsState('disconnected');
    if (!stopped) reconTimer = setTimeout(connectWs, RECONNECT_DELAY);
  };

  ws.onerror = () => {
    store.setWsState('error');
    ws?.close();
  };
}

export function disconnectWs() {
  stopped = true;
  clearTimers();
  ws?.close();
  ws = null;
}

function handleMessage(msg: { type: string; data: unknown; ts?: number }) {
  const store = useRealtimeStore.getState();
  const now   = new Date().toISOString();

  switch (msg.type) {
    case 'service_health':
      store.setServices(msg.data as Parameters<typeof store.setServices>[0]);
      break;
    case 'platform_stats':
      store.setStats(msg.data as Parameters<typeof store.setStats>[0]);
      break;
    case 'event': {
      const ev = msg.data as LiveEvent;
      if (!ev.id) ev.id = crypto.randomUUID();
      if (!ev.timestamp) ev.timestamp = now;
      store.pushEvent(ev);
      break;
    }
    case 'queue_stats':
      store.setQueues(msg.data as Parameters<typeof store.setQueues>[0]);
      break;
    case 'infra_metrics':
      store.setInfra(msg.data as Parameters<typeof store.setInfra>[0]);
      break;
    case 'pong':
      // heartbeat ok
      break;
  }
}
