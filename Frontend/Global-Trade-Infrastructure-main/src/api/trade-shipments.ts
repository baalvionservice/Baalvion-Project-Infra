/**
 * @file src/api/trade-shipments.ts
 * @description The PARTY-SCOPED shipment surface — trade-service `/v1/dashboard/shipments`.
 *
 * This is the view a counterparty is entitled to. `src/api/shipments.ts` wraps the legacy
 * `/v1/shipments` collection, which is scoped by TENANT alone: fine for an operator looking at
 * their own book, wrong for a buyer and a seller who sit in different orgs and must each see the
 * one trade they are party to. The endpoints here resolve the caller's buyer/seller role on the
 * server (service/dashboard/rbac.js) and 404 anything outside it, so the client never has to
 * decide what a party may read.
 *
 * Everything a party needs about a moving trade hangs off one shipment id: the sailing and its
 * port calls, the merged event timeline, the document set, the readiness score, and the clearance
 * stage clock that says where the paperwork time went.
 */
import { useQuery } from '@tanstack/react-query';
import { tradeApi, type Paginated } from './client';
import { qk } from './keys';

export type TradeShipmentStatus =
  | 'booked' | 'picked_up' | 'in_transit' | 'port_processing' | 'customs_clearance'
  | 'customs_hold' | 'released' | 'out_for_delivery' | 'delivered' | 'delayed'
  | 're_routed' | 'exception' | 'cancelled';

/** The operation both parties are attached to — the reason either of them can see the shipment. */
export interface TradeOperationRef {
  id: string;
  reference_no: string | null;
  buyer_org_id: string | null;
  seller_org_id: string | null;
  commodity: string | null;
  status: string | null;
  priority: string | null;
  currency: string | null;
  total_value: string | number | null;
}

/** `tradeops.shipments` — UUID PK, distinct from the legacy integer-PK `trade.shipments`. */
export interface TradeShipment {
  id: string;
  tenant_id: string;
  trade_operation_id: string;
  shipment_no: string;
  carrier_id: string | null;
  carrier_name: string | null;
  mode: 'sea' | 'air' | 'road' | 'rail' | 'multimodal' | null;
  tracking_number: string | null;
  vessel_name: string | null;
  voyage_no: string | null;
  voyage_id: string | null;
  container_no: string | null;
  bill_of_lading_no: string | null;
  origin_port: string | null;
  destination_port: string | null;
  origin_country: string | null;
  destination_country: string | null;
  status: TradeShipmentStatus;
  estimated_departure: string | null;
  actual_departure: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  gross_weight_kg: string | null;
  volume_cbm: string | null;
  package_count: number | null;
  declared_value: string | null;
  currency: string | null;
  incoterm: string | null;
  tradeOperation?: TradeOperationRef | null;
  created_at: string;
  updated_at: string;
}

/** One stop on a vessel's rotation. `actual*` is what happened; `eta`/`etd` is what was published. */
export interface PortCall {
  id: string;
  voyageId: string;
  sequence: number;
  portCode: string | null;
  portName: string | null;
  countryCode: string | null;
  terminal: string | null;
  callType: string | null;
  eta: string | null;
  etd: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  status: string | null;
  cutoffAt: string | null;
  /** Measured against the published ETA — null until the ship actually arrives. */
  delayHours: number | null;
}

export interface VesselRef {
  id: string;
  name: string | null;
  imo?: string | null;
  mmsi?: string | null;
  flag?: string | null;
  [key: string]: unknown;
}

export interface Voyage {
  id: string;
  voyageNo?: string | null;
  status?: string | null;
  vessel?: VesselRef | null;
  portCalls?: PortCall[];
  dataSource?: string | null;
  [key: string]: unknown;
}

/**
 * Where the ship is. NOTE `basis`: the server derives this from port-call rows, not from an AIS or
 * GPS fix, and returns no coordinates because none were measured. `observedAt` is the last thing
 * anyone actually recorded. Render it as a last-confirmed position, never as a live one.
 */
export interface VesselPosition {
  vessel: VesselRef;
  state: 'in_port' | 'at_sea' | 'unknown';
  currentCall: PortCall | null;
  lastDeparted: PortCall | null;
  nextCall: PortCall | null;
  basis: 'port_call_schedule';
  observed: boolean;
  observedAt: string | null;
}

export interface ShipmentSchedule {
  shipmentId: string;
  shipmentNo: string;
  booked: boolean;
  note?: string;
  vesselName?: string | null;
  voyageNo?: string | null;
  voyage?: Voyage | null;
  loadCall?: PortCall | null;
  dischargeCall?: PortCall | null;
  vesselPosition?: VesselPosition | null;
  estimatedDeparture: string | null;
  estimatedArrival: string | null;
}

export interface TimelineEntry {
  id: string;
  kind: 'event' | 'comment' | 'status_change' | 'workflow' | 'tracking' | 'checkpoint';
  at: string;
  title: string;
  description?: string | null;
  code?: string | null;
  location?: { name?: string | null; country?: string | null; lat?: number | null; lng?: number | null } | null;
  source?: string | null;
  actor?: string | null;
  from?: string | null;
  to?: string | null;
  reason?: string | null;
  note?: string | null;
  checkpointType?: string | null;
  delayMinutes?: number | null;
  waitingMinutes?: number | null;
}

export interface ShipmentTimeline {
  shipment_id: string;
  count: number;
  entries: TimelineEntry[];
}

export interface ShipmentDocument {
  id: string;
  shipment_id: string;
  doc_type: string;
  status: string | null;
  file_name?: string | null;
  issued_at?: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface ShipmentReadiness {
  shipment_id: string;
  score: number;
  band?: string;
  components?: Record<string, unknown>;
  gaps?: unknown[];
  [key: string]: unknown;
}

/** One clearance stage's clock. `blocked_hours` is the part of `elapsed_hours` spent waiting. */
export interface ClearanceStage {
  stage: string;
  label: string;
  track: string | null;
  owner: string | null;
  status: 'pending' | 'active' | 'blocked' | 'done' | 'skipped';
  elapsed_hours: number;
  blocked_hours: number;
  working_hours: number;
  baseline_hours: number | null;
  target_hours: number | null;
  /** > 1 means the stage is running slower than the model promises. */
  vs_target: number | null;
  vs_baseline: number | null;
  breached: boolean;
  /** > 1 means the stage was reopened — the rework signal. */
  touch_count: number;
  blocked_by: string | null;
  open: boolean;
  share_pct?: number;
}

export interface ClearanceLedger {
  subject: { type: string; id: string };
  engine_version: string;
  stages: ClearanceStage[];
  bottlenecks: ClearanceStage[];
  by_track: Record<string, number>;
  by_party: Record<string, number>;
  vital_few: string[];
  totals: {
    elapsed_hours: number;
    elapsed_days: number;
    blocked_hours: number;
    working_hours: number;
    rework_touches: number;
    breached_stages: number;
    open_stages: number;
  };
  model?: unknown;
}

/** One stage aggregated across every trade the caller is a party to. */
export interface ClearanceStageRollup {
  stage: string;
  label: string;
  track: string | null;
  owner: string | null;
  count: number;
  total_hours: number;
  mean_hours: number;
  /** What a promise has to be built on — the mean hides the tail. */
  p90_hours: number;
  blocked_hours: number;
  breach_rate: number;
  rework_rate: number;
  target_hours: number | null;
  baseline_hours: number | null;
  share_pct: number;
}

export interface ClearanceBottlenecks {
  engine_version: string;
  sample_rows: number;
  total_hours: number;
  stages: ClearanceStageRollup[];
  by_party: Record<string, number>;
  by_track: Record<string, number>;
  /** The smallest set of stages holding 80% of elapsed time. */
  vital_few: string[];
  /** Echoed by the server so the UI can say whose book this covers. */
  scope?: 'all' | 'buyer' | 'seller' | 'party';
}

export interface TradeShipmentListParams {
  buyer?: string;
  seller?: string;
  /** Comma-separated statuses — the server splits on ','. */
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

export const tradeShipmentsApi = {
  list: (params: TradeShipmentListParams = {}) =>
    tradeApi.list<TradeShipment>('/dashboard/shipments', params as Record<string, string | number>),
  detail: (id: string) => tradeApi.get<TradeShipment>(`/dashboard/shipments/${id}`),
  timeline: (id: string) => tradeApi.get<ShipmentTimeline>(`/dashboard/shipments/${id}/timeline`),
  readiness: (id: string) => tradeApi.get<ShipmentReadiness>(`/dashboard/shipments/${id}/readiness`),
  documents: (id: string) =>
    tradeApi.get<{ shipment_id: string; count: number; documents: ShipmentDocument[] }>(`/dashboard/shipments/${id}/documents`),
  schedule: (id: string) => tradeApi.get<ShipmentSchedule>(`/dashboard/shipments/${id}/schedule`),
  clearance: (id: string) => tradeApi.get<ClearanceLedger>(`/dashboard/shipments/${id}/clearance`),
  // Party-scoped by the server: a buyer/seller gets this rollup over their OWN
  // trades, an operator over the tenant's book.
  clearanceBottlenecks: (params: { since?: string; limit?: number } = {}) =>
    tradeApi.get<ClearanceBottlenecks>('/clearance_ledger/bottlenecks', params),
};

// ── Hooks ────────────────────────────────────────────────────────────────────
// A moving shipment is worth re-reading; a document set or a stage clock changes
// on human timescales, so those are left to the default staleness.

export function useTradeShipments(params: TradeShipmentListParams = {}) {
  return useQuery<Paginated<TradeShipment>>({
    queryKey: qk.tradeShipments.list(params),
    queryFn: () => tradeShipmentsApi.list(params),
    refetchInterval: 60_000,
  });
}

export function useTradeShipment(id: string | undefined) {
  return useQuery<TradeShipment>({
    queryKey: qk.tradeShipments.detail(id ?? ''),
    queryFn: () => tradeShipmentsApi.detail(id as string),
    enabled: !!id,
  });
}

export function useTradeShipmentTimeline(id: string | undefined) {
  return useQuery<ShipmentTimeline>({
    queryKey: qk.tradeShipments.timeline(id ?? ''),
    queryFn: () => tradeShipmentsApi.timeline(id as string),
    enabled: !!id,
    refetchInterval: 60_000,
  });
}

export function useTradeShipmentSchedule(id: string | undefined) {
  return useQuery<ShipmentSchedule>({
    queryKey: qk.tradeShipments.schedule(id ?? ''),
    queryFn: () => tradeShipmentsApi.schedule(id as string),
    enabled: !!id,
    refetchInterval: 60_000,
  });
}

export function useTradeShipmentClearance(id: string | undefined) {
  return useQuery<ClearanceLedger>({
    queryKey: qk.tradeShipments.clearance(id ?? ''),
    queryFn: () => tradeShipmentsApi.clearance(id as string),
    enabled: !!id,
  });
}

export function useClearanceBottlenecks(params: { since?: string; limit?: number } = {}) {
  return useQuery<ClearanceBottlenecks>({
    queryKey: qk.tradeShipments.bottlenecks(params),
    queryFn: () => tradeShipmentsApi.clearanceBottlenecks(params),
  });
}

export function useTradeShipmentDocuments(id: string | undefined) {
  return useQuery({
    queryKey: qk.tradeShipments.documents(id ?? ''),
    queryFn: () => tradeShipmentsApi.documents(id as string),
    enabled: !!id,
  });
}

export function useTradeShipmentReadiness(id: string | undefined) {
  return useQuery<ShipmentReadiness>({
    queryKey: qk.tradeShipments.readiness(id ?? ''),
    queryFn: () => tradeShipmentsApi.readiness(id as string),
    enabled: !!id,
  });
}
