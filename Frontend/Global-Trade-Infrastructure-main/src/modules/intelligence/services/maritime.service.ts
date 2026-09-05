/**
 * @file maritime.service.ts
 * @description Maritime/logistics tracking intelligence — backed by trade-service's real
 * Shipment Tracking & Global Visibility Platform (tracking_dashboard, shipment_alerts).
 * No fixture data: an empty/quiet network returns empty results, not placeholder vessels.
 */
import { apiClient } from '@/lib/api-client';
import { MaritimeEvent } from '../types';

interface RawAlert {
  id: string;
  shipmentId: string;
  alertType: MaritimeEvent['type'];
  severity: MaritimeEvent['severity'];
  message: string;
  triggeredAt: string;
  shipmentNo: string | null;
  vesselName: string | null;
  mode: MaritimeEvent['mode'];
  originPort: string | null;
  destinationPort: string | null;
}

export interface TrackingSummary {
  active: number;
  delivered: number;
  delayed: number;
  customsHold: number;
  exception: number;
  inTransit: number;
  totalShipments: number;
  activeAlerts: number;
  avgTransitDays: number | null;
  etaAccuracyPct: number | null;
  shipmentHealthPct: number | null;
}

interface RawMapPoint {
  shipmentId: string;
  shipmentNo: string;
  status: string;
  locationLabel: string | null;
  mode: MaritimeEvent['mode'];
  originPort: string | null;
  destinationPort: string | null;
}

function laneLabel(originPort: string | null, destinationPort: string | null): string | null {
  if (originPort && destinationPort) return `${originPort} → ${destinationPort}`;
  return originPort || destinationPort || null;
}

class MaritimeService {
  private static instance: MaritimeService;
  private constructor() {}
  public static getInstance(): MaritimeService {
    if (!MaritimeService.instance) MaritimeService.instance = new MaritimeService();
    return MaritimeService.instance;
  }

  /** Real active shipment alerts (geofence/IoT/delay/ETA engine output), enriched with the
   *  triggering shipment's real vessel/lane context. */
  async getRecentEvents(): Promise<MaritimeEvent[]> {
    const res = await apiClient.get<RawAlert[]>('/tracking_dashboard/alerts', { limit: 15 });
    const rows = res.data || [];
    return rows.map((a) => ({
      id: a.id,
      vesselId: a.shipmentId,
      vesselName: a.vesselName || a.shipmentNo || a.shipmentId,
      type: a.alertType,
      location: laneLabel(a.originPort, a.destinationPort),
      mode: a.mode,
      timestamp: a.triggeredAt,
      severity: a.severity,
    }));
  }

  /** Real port/location load: active shipments grouped by their last known GPS/carrier-event
   *  location. A count-based proxy for congestion — no fabricated percentages or trend arrows,
   *  since no historical snapshot series exists to compute a real trend from yet. */
  async getCongestionMatrix(): Promise<Array<{ port: string; vesselCount: number }>> {
    const res = await apiClient.get<RawMapPoint[]>('/tracking_dashboard/map_overview', {});
    const points = res.data || [];
    const counts = new Map<string, number>();
    for (const p of points) {
      const key = p.locationLabel || laneLabel(p.originPort, p.destinationPort);
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([port, vesselCount]) => ({ port, vesselCount }))
      .sort((a, b) => b.vesselCount - a.vesselCount);
  }

  /** Real fleet-wide KPIs — transit time, ETA accuracy, and shipment health are computed
   *  server-side from actual shipment timestamps, not asserted percentages. */
  async getSummary(): Promise<TrackingSummary> {
    const res = await apiClient.get<TrackingSummary>('/tracking_dashboard/summary', {});
    return res.data || {
      active: 0, delivered: 0, delayed: 0, customsHold: 0, exception: 0, inTransit: 0,
      totalShipments: 0, activeAlerts: 0, avgTransitDays: null, etaAccuracyPct: null, shipmentHealthPct: null,
    };
  }
}

export const maritimeService = MaritimeService.getInstance();
