/**
 * @file intelligence/types.ts
 * @description Master data contracts for Global Trade Intelligence & Maritime SIGINT.
 */

import { RiskLevel } from '@/types/institutional';

export type IntelligenceType = 'MARITIME' | 'GEOPOLITICAL' | 'TRADE_SIGNAL' | 'DISRUPTION' | 'FORECAST';

/** Real trade-service alert types (tradeops.shipment_alerts.alert_type) — the taxonomy the
 *  tracking-platform's geofence/IoT/delay/ETA engines actually emit, not a fictional set. */
export type ShipmentAlertType =
  | 'gps_lost' | 'offline' | 'geofence_enter' | 'geofence_exit' | 'delay'
  | 'route_deviation' | 'temperature' | 'humidity' | 'shock' | 'unauthorized_opening'
  | 'container_tampering' | 'battery_low' | 'eta_changed' | 'late_delivery'
  | 'customs_hold' | 'delivered';

export interface MaritimeEvent {
  id: string;
  /** The shipment id — no separate vessel/IMO registry exists, so this IS the real vessel key. */
  vesselId: string;
  /** Real vessel_name when the shipment has one (sea mode); falls back to the shipment number. */
  vesselName: string;
  type: ShipmentAlertType;
  /** Origin/destination port pair when known; null when the shipment doesn't carry lane data. */
  location: string | null;
  mode: 'sea' | 'air' | 'road' | 'rail' | 'multimodal' | null;
  timestamp: string;
  severity: RiskLevel;
}

export interface GeopoliticalAlert {
  id: string;
  region: string;
  title: string;
  message: string;
  impactScore: number; // 0-100
  affectedNodes: string[];
  severity: RiskLevel;
  createdAt: string;
}

export interface DisruptionCase {
  id: string;
  type: 'CONGESTION' | 'STRIKE' | 'SANCTIONS_BLOCK' | 'INFRASTRUCTURE_FAILURE';
  title: string;
  estimatedDelayHours: number;
  probability: number;
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED';
  involvedEntities: string[];
  createdAt: string;
}

export interface OperationalForecast {
  id: string;
  target: 'CORRIDOR_THROUGHPUT' | 'SETTLEMENT_LATENCY' | 'SUPPLIER_RISK';
  prediction: string;
  confidence: number;
  trend: 'OPTIMIZING' | 'STABLE' | 'DEGRADED';
  validUntil: string;
}
