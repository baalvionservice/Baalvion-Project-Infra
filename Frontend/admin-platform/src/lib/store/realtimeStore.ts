import { create } from 'zustand';
import type {
  ServiceStatus, PlatformStats, LiveEvent, QueueStat,
  InfraMetrics, TimeSeriesPoint, WsConnectionState,
} from '@/lib/types/realtime.types';

const MAX_EVENTS  = 100;
const MAX_TS_PTS  = 60;  // 60 points = 5 min at 5s intervals

interface RealtimeState {
  wsState:        WsConnectionState;
  services:       ServiceStatus[];
  stats:          PlatformStats | null;
  events:         LiveEvent[];
  queues:         QueueStat[];
  infra:          InfraMetrics | null;
  // time series for charts
  requestSeries:  TimeSeriesPoint[];   // req/min over time
  latencySeries:  TimeSeriesPoint[];   // p95 latency over time
  loginSeries:    TimeSeriesPoint[];   // logins/failed over time

  setWsState:      (s: WsConnectionState) => void;
  setServices:     (s: ServiceStatus[]) => void;
  setStats:        (s: PlatformStats) => void;
  pushEvent:       (e: LiveEvent) => void;
  setQueues:       (q: QueueStat[]) => void;
  setInfra:        (m: InfraMetrics) => void;
  pushRequestPoint:(p: TimeSeriesPoint) => void;
  pushLatencyPoint:(p: TimeSeriesPoint) => void;
  pushLoginPoint:  (p: TimeSeriesPoint) => void;
  clearEvents:     () => void;
}

function pushCapped<T>(arr: T[], item: T, max: number): T[] {
  const next = [...arr, item];
  return next.length > max ? next.slice(next.length - max) : next;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  wsState:       'disconnected',
  services:      [],
  stats:         null,
  events:        [],
  queues:        [],
  infra:         null,
  requestSeries: [],
  latencySeries: [],
  loginSeries:   [],

  setWsState:       (wsState)    => set({ wsState }),
  setServices:      (services)   => set({ services }),
  setStats:         (stats)      => set({ stats }),
  pushEvent:        (e)          => set((s) => ({ events: pushCapped(s.events, e, MAX_EVENTS) })),
  setQueues:        (queues)     => set({ queues }),
  setInfra:         (infra)      => set({ infra }),
  pushRequestPoint: (p)          => set((s) => ({ requestSeries: pushCapped(s.requestSeries, p, MAX_TS_PTS) })),
  pushLatencyPoint: (p)          => set((s) => ({ latencySeries: pushCapped(s.latencySeries, p, MAX_TS_PTS) })),
  pushLoginPoint:   (p)          => set((s) => ({ loginSeries: pushCapped(s.loginSeries, p, MAX_TS_PTS) })),
  clearEvents:      ()           => set({ events: [] }),
}));
