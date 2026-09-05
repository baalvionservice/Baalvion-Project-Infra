/**
 * @file sea-route-intelligence-service.ts
 * @description Maritime route/congestion intelligence, derived entirely from real
 * `tradeops.shipments` records (trade-service's Trade Operations Cloud) — no named
 * corridor registry or risk-zone feed exists in this platform, so routes are computed
 * from real origin/destination lanes instead of a hand-authored list.
 */
import { apiClient } from '@/lib/api-client';

interface RawShipment {
  id: string;
  mode: 'sea' | 'air' | 'road' | 'rail' | 'multimodal' | null;
  status: string;
  origin_port: string | null;
  destination_port: string | null;
  estimated_departure: string | null;
  actual_departure: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
}

const ACTIVE_STATUSES = ['booked', 'picked_up', 'in_transit', 'port_processing', 'customs_clearance', 'released'];
const TROUBLED_STATUSES = new Set(['delayed', 'exception', 'customs_hold', 're_routed']);

export interface SeaRoute {
  id: string;
  originPort: string;
  destinationPort: string;
  status: 'active' | 'obstructed';
  avgTransitDays: number | null;
  activeShipmentCount: number;
}

/** No real geopolitical/piracy/weather risk feed is wired into this platform yet — kept as an
 *  explicit type so a future real integration (news/AIS risk feed) has somewhere to land. */
export interface RiskZone {
  id: string;
  name: string;
  type: 'piracy' | 'geopolitical' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedRouteIds: string[];
  active: boolean;
}

export interface CongestionReport {
  id: string;
  port: string;
  delayedShipmentCount: number;
  avgDelayHours: number | null;
}

async function fetchActiveSeaShipments(): Promise<RawShipment[]> {
  const res = await apiClient.get<{ items: RawShipment[] }>('/dashboard/shipments', {
    status: [...ACTIVE_STATUSES, ...TROUBLED_STATUSES].join(','),
    limit: 200,
  });
  return (res.data?.items || []).filter((s) => s.mode === 'sea' && s.origin_port && s.destination_port);
}

function transitDays(s: RawShipment): number | null {
  const start = s.actual_departure || s.estimated_departure;
  const end = s.actual_arrival || s.estimated_arrival;
  if (!start || !end) return null;
  const days = (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
  return Number.isFinite(days) && days >= 0 ? days : null;
}

export const seaRouteIntelligenceService = {
  /** Real active/troubled sea shipments grouped into origin→destination lanes. */
  async getSeaRoutes(): Promise<SeaRoute[]> {
    const shipments = await fetchActiveSeaShipments();
    const byLane = new Map<string, RawShipment[]>();
    for (const s of shipments) {
      const key = `${s.origin_port}::${s.destination_port}`;
      const list = byLane.get(key) || [];
      list.push(s);
      byLane.set(key, list);
    }
    return [...byLane.entries()].map(([key, group]): SeaRoute => {
      const [originPort, destinationPort] = key.split('::');
      const days = group.map(transitDays).filter((d): d is number => d != null);
      const avgTransitDays = days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null;
      return {
        id: key,
        originPort,
        destinationPort,
        status: group.some((s) => TROUBLED_STATUSES.has(s.status)) ? 'obstructed' : 'active',
        avgTransitDays,
        activeShipmentCount: group.length,
      };
    }).sort((a, b) => b.activeShipmentCount - a.activeShipmentCount);
  },

  /** No real risk-zone data source (news/AIS/piracy feed) is integrated — an honest empty
   *  result rather than a fabricated Red Sea/Malacca Strait list. */
  async getRiskZones(): Promise<RiskZone[]> {
    return [];
  },

  /** Real per-port delay signal from shipments actually flagged `delayed`. */
  async getCongestionReports(): Promise<CongestionReport[]> {
    const res = await apiClient.get<{ items: RawShipment[] }>('/dashboard/shipments', { status: 'delayed', limit: 200 });
    const delayed = (res.data?.items || []).filter((s) => s.destination_port);
    const byPort = new Map<string, RawShipment[]>();
    for (const s of delayed) {
      const list = byPort.get(s.destination_port as string) || [];
      list.push(s);
      byPort.set(s.destination_port as string, list);
    }
    return [...byPort.entries()].map(([port, group]) => {
      const now = Date.now();
      const overdueHours = group
        .map((s) => (s.estimated_arrival ? (now - new Date(s.estimated_arrival).getTime()) / 3600000 : null))
        .filter((h): h is number => h != null && h > 0);
      return {
        id: port,
        port,
        delayedShipmentCount: group.length,
        avgDelayHours: overdueHours.length ? Math.round(overdueHours.reduce((a, b) => a + b, 0) / overdueHours.length) : null,
      };
    }).sort((a, b) => b.delayedShipmentCount - a.delayedShipmentCount);
  },

  /** Route Health Index (0-100) — congestion (shipment volume on the lane) and troubled-status
   *  ratio pull it down; a real delay report on either endpoint port pulls it down further. */
  calculateRouteHealth(route: SeaRoute, reports: CongestionReport[], zones: RiskZone[]): number {
    let health = 100;
    health -= Math.min(40, route.activeShipmentCount * 4);
    if (route.status === 'obstructed') health -= 25;

    const portDelays = reports.filter((r) => r.port === route.originPort || r.port === route.destinationPort);
    portDelays.forEach((r) => { health -= Math.min(30, r.delayedShipmentCount * 5); });

    const relatedRisks = zones.filter((z) => z.affectedRouteIds.includes(route.id));
    relatedRisks.forEach((z) => {
      if (z.severity === 'critical') health -= 40;
      else if (z.severity === 'high') health -= 25;
      else if (z.severity === 'medium') health -= 10;
    });

    return Math.max(0, Math.round(health));
  },
};
