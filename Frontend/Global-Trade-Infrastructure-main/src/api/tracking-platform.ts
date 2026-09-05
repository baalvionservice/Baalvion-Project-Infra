/**
 * @file src/api/tracking-platform.ts
 * @description Shipment Tracking & Global Visibility Platform — wraps the live trade-service
 * tracking-platform surface (dashboard KPIs/map/alerts, geofences, checkpoints, IoT, proof of
 * delivery, ETA prediction, delay events, planned routes, cross-entity search) with normalized
 * DTOs + React Query hooks, following the exact shape of src/api/shipments.ts.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeApi, type Paginated } from './client';
import { qk } from './keys';

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface TrackingDashboardSummary {
  active: number;
  delivered: number;
  delayed: number;
  customsHold: number;
  exception: number;
  cancelled: number;
  inTransit: number;
  waitingPickup: number;
  outForDelivery: number;
  returned: number;
  avgTransitDays: number | null;
  etaAccuracyPct: number | null;
  shipmentHealthPct: number | null;
  activeAlerts: number;
  totalShipments: number;
}

export interface MapOverviewPoint {
  shipmentId: string;
  shipmentNo: string;
  status: string;
  latitude: number;
  longitude: number;
  locationLabel: string | null;
  lastUpdated: string | null;
  /** Who reported the fix. 'simulated' until TRACKING_API_KEY names a real carrier feed. */
  source: string | null;
}

// ── Geofences ────────────────────────────────────────────────────────────────
export interface Geofence {
  id: string;
  name: string;
  fenceType: string;
  shape: Record<string, unknown>;
  active: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGeofenceBody {
  name: string;
  fenceType: string;
  shape: Record<string, unknown>;
  active?: boolean;
}

// ── Alerts ───────────────────────────────────────────────────────────────────
export interface ShipmentAlert {
  id: string;
  shipmentId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: string;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  metadata: Record<string, unknown>;
}

// ── Checkpoints ──────────────────────────────────────────────────────────────
export interface ShipmentCheckpoint {
  id: string;
  shipmentId: string;
  checkpointType: string;
  name: string | null;
  sequence: number;
  arrivedAt: string | null;
  departedAt: string | null;
  delayMinutes: number | null;
  waitingMinutes: number | null;
  inspectionStatus: string;
  approved: boolean;
}

// ── IoT ──────────────────────────────────────────────────────────────────────
export interface IotDevice {
  id: string;
  shipmentId: string | null;
  containerId: string | null;
  deviceType: string;
  externalDeviceId: string | null;
  provider: string | null;
  status: 'online' | 'offline' | 'unknown';
  lastSeenAt: string | null;
  batteryPct: number | null;
}

export interface IotSensorReading {
  id: string;
  metricType: string;
  value: number | null;
  unit: string | null;
  recordedAt: string;
}

// ── Proof of delivery ────────────────────────────────────────────────────────
export interface ProofOfDelivery {
  id: string;
  shipmentId: string;
  receiverName: string | null;
  signatureUrl: string | null;
  photoUrls: string[];
  deliveredAt: string;
  otpVerified: boolean;
  notes: string | null;
}

// ── GPS tracking events (existing /tracking_events surface) ──────────────────
export interface TrackingEventPing {
  id: string;
  shipmentId: string;
  containerId: string | null;
  source: string;
  eventType: string;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string | null;
  occurredAt: string;
}

// ── ETA prediction ───────────────────────────────────────────────────────────
export interface EtaPrediction {
  id: string;
  shipmentId: string;
  predictedEta: string | null;
  confidencePct: number | null;
  riskScore: number | null;
  delayProbabilityPct: number | null;
  factors: Record<string, unknown>;
  modelVersion: string;
  computedAt: string;
}

// ── Delay events ─────────────────────────────────────────────────────────────
export interface DelayEvent {
  id: string;
  shipmentId: string;
  delayType: string;
  detectedAt: string;
  estimatedDelayMinutes: number | null;
  resolved: boolean;
  resolvedAt: string | null;
}

// ── Cross-entity search ──────────────────────────────────────────────────────
export interface TrackingSearchResult {
  shipments: Array<{ id: string; shipment_no: string; status: string; tracking_number: string | null }>;
  containers: Array<{ id: string; container_number: string; status: string }>;
  vehicles: Array<{ id: string; vehicle_number: string; status: string }>;
  freightBookings: Array<{ id: string; tracking_number: string | null; status: string }>;
  purchaseOrders: Array<{ id: string; po_number: string }>;
}

// ── API ──────────────────────────────────────────────────────────────────────
export const trackingPlatformApi = {
  dashboardSummary: () => tradeApi.get<TrackingDashboardSummary>('/tracking_dashboard/summary'),
  dashboardMapOverview: () => tradeApi.get<MapOverviewPoint[]>('/tracking_dashboard/map_overview'),
  dashboardAlerts: (limit = 20) => tradeApi.get<ShipmentAlert[]>('/tracking_dashboard/alerts', { limit }),
  dashboardRecentEvents: (limit = 20) => tradeApi.get<unknown[]>('/tracking_dashboard/recent_events', { limit }),
  dashboardCarrierPerformance: () => tradeApi.get<unknown[]>('/tracking_dashboard/carrier_performance'),

  search: (q: string) => tradeApi.get<TrackingSearchResult>('/tracking_search', { q }),

  geofences: {
    list: (params: { active?: boolean; fenceType?: string } = {}) => tradeApi.list<Geofence>('/geofences', params),
    create: (body: CreateGeofenceBody) => tradeApi.post<Geofence>('/geofences', body),
    update: (id: string, body: Partial<CreateGeofenceBody>) => tradeApi.patch<Geofence>(`/geofences/${id}`, body),
    remove: (id: string) => tradeApi.delete<{ id: string; deleted: boolean }>(`/geofences/${id}`),
  },

  checkpoints: {
    listForShipment: (shipmentId: string) => tradeApi.list<ShipmentCheckpoint>('/shipment_checkpoints', { shipmentId }),
    arrive: (body: { shipmentId: string; checkpointType: string; name?: string; sequence?: number; latitude?: number; longitude?: number }) =>
      tradeApi.post<ShipmentCheckpoint>('/shipment_checkpoints/arrive', body),
    depart: (id: string, body: { inspectionStatus?: string; approved?: boolean } = {}) =>
      tradeApi.post<ShipmentCheckpoint>(`/shipment_checkpoints/${id}/depart`, body),
  },

  alerts: {
    list: (params: { shipmentId?: string; status?: string; severity?: string } = {}) => tradeApi.list<ShipmentAlert>('/shipment_alerts', params),
    acknowledge: (id: string) => tradeApi.post<ShipmentAlert>(`/shipment_alerts/${id}/acknowledge`, {}),
    resolve: (id: string) => tradeApi.post<ShipmentAlert>(`/shipment_alerts/${id}/resolve`, {}),
  },

  iot: {
    listDevices: (params: { shipmentId?: string; deviceType?: string } = {}) => tradeApi.list<IotDevice>('/iot_devices', params),
    register: (body: { shipmentId?: string; containerId?: string; deviceType: string; externalDeviceId?: string; provider?: string }) =>
      tradeApi.post<IotDevice>('/iot_devices', body),
    listReadings: (deviceId: string) => tradeApi.list<IotSensorReading>(`/iot_devices/${deviceId}/readings`),
  },

  proofOfDelivery: {
    list: (params: { shipmentId?: string } = {}) => tradeApi.list<ProofOfDelivery>('/proof_of_delivery', params),
    issueOtp: (shipmentId: string) => tradeApi.post<{ otp: string; expiresInMs: number }>(`/proof_of_delivery/${shipmentId}/otp`, {}),
    capture: (body: { shipmentId: string; receiverName?: string; signatureUrl?: string; photoUrls?: string[]; otpCode?: string; notes?: string }) =>
      tradeApi.post<ProofOfDelivery>('/proof_of_delivery', body),
  },

  eta: {
    latest: (shipmentId: string) => tradeApi.get<EtaPrediction>(`/eta_predictions/${shipmentId}/latest`),
    history: (shipmentId: string) => tradeApi.list<EtaPrediction>(`/eta_predictions/${shipmentId}`),
    recompute: (shipmentId: string) => tradeApi.post<EtaPrediction>(`/eta_predictions/${shipmentId}/recompute`, {}),
  },

  delayEvents: {
    list: (params: { shipmentId?: string; resolved?: boolean } = {}) => tradeApi.list<DelayEvent>('/delay_events', params),
    resolve: (id: string) => tradeApi.post<DelayEvent>(`/delay_events/${id}/resolve`, {}),
  },

  timeline: (shipmentId: string) => tradeApi.get<{ shipment_id: string; count: number; entries: unknown[] }>(`/dashboard/shipments/${shipmentId}/timeline`),

  // Latest GPS/carrier ping for one shipment (the existing tracking_events surface,
  // sorted newest-first server-side — see controller/trackingController.js `list`).
  latestTrackingEvent: (shipmentId: string) =>
    tradeApi.list<TrackingEventPing>('/tracking_events', { shipmentId, limit: 1 }),
};

// ── Hooks ────────────────────────────────────────────────────────────────────
export function useTrackingDashboardSummary() {
  return useQuery({ queryKey: qk.trackingPlatform.dashboardSummary, queryFn: trackingPlatformApi.dashboardSummary, refetchInterval: 30_000 });
}

export function useTrackingMapOverview() {
  return useQuery({ queryKey: qk.trackingPlatform.dashboardMap, queryFn: trackingPlatformApi.dashboardMapOverview, refetchInterval: 15_000 });
}

export function useTrackingDashboardAlerts(limit = 20) {
  return useQuery({ queryKey: qk.trackingPlatform.dashboardAlerts, queryFn: () => trackingPlatformApi.dashboardAlerts(limit), refetchInterval: 20_000 });
}

export function useTrackingSearch(q: string) {
  return useQuery({ queryKey: qk.trackingPlatform.search(q), queryFn: () => trackingPlatformApi.search(q), enabled: q.trim().length > 0 });
}

export function useGeofences(params: { active?: boolean; fenceType?: string } = {}) {
  return useQuery({ queryKey: qk.trackingPlatform.geofences(params), queryFn: () => trackingPlatformApi.geofences.list(params) });
}

export function useCreateGeofence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackingPlatformApi.geofences.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trackingPlatform.all }),
  });
}

export function useShipmentAlerts(params: { shipmentId?: string; status?: string; severity?: string } = {}) {
  return useQuery({ queryKey: qk.trackingPlatform.alerts(params), queryFn: () => trackingPlatformApi.alerts.list(params), refetchInterval: 20_000 });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackingPlatformApi.alerts.acknowledge,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trackingPlatform.all }),
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackingPlatformApi.alerts.resolve,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trackingPlatform.all }),
  });
}

export function useShipmentCheckpoints(shipmentId: string) {
  return useQuery({
    queryKey: qk.trackingPlatform.checkpoints(shipmentId),
    queryFn: () => trackingPlatformApi.checkpoints.listForShipment(shipmentId),
    enabled: !!shipmentId,
  });
}

export function useIotDevices(params: { shipmentId?: string; deviceType?: string } = {}) {
  return useQuery({ queryKey: qk.trackingPlatform.iotDevices(params), queryFn: () => trackingPlatformApi.iot.listDevices(params) });
}

export function useIotReadings(deviceId: string) {
  return useQuery({
    queryKey: qk.trackingPlatform.iotReadings(deviceId),
    queryFn: () => trackingPlatformApi.iot.listReadings(deviceId),
    enabled: !!deviceId,
  });
}

export function useProofOfDelivery(params: { shipmentId?: string } = {}) {
  return useQuery({ queryKey: qk.trackingPlatform.proofOfDelivery(params), queryFn: () => trackingPlatformApi.proofOfDelivery.list(params) });
}

export function useCapturePod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackingPlatformApi.proofOfDelivery.capture,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trackingPlatform.all }),
  });
}

export function useLatestEtaPrediction(shipmentId: string) {
  return useQuery({
    queryKey: qk.trackingPlatform.etaLatest(shipmentId),
    queryFn: () => trackingPlatformApi.eta.latest(shipmentId),
    enabled: !!shipmentId,
    retry: false,
  });
}

export function useRecomputeEta(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => trackingPlatformApi.eta.recompute(shipmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.trackingPlatform.etaLatest(shipmentId) }),
  });
}

export function useDelayEvents(params: { shipmentId?: string; resolved?: boolean } = {}) {
  return useQuery({ queryKey: qk.trackingPlatform.delayEvents(params), queryFn: () => trackingPlatformApi.delayEvents.list(params) });
}

export function useLatestTrackingPosition(shipmentId: string) {
  return useQuery({
    queryKey: [...qk.trackingPlatform.all, 'latest-position', shipmentId],
    queryFn: () => trackingPlatformApi.latestTrackingEvent(shipmentId),
    enabled: !!shipmentId,
    refetchInterval: 15_000,
  });
}

export function useShipmentTimeline(shipmentId: string) {
  return useQuery({
    queryKey: qk.trackingPlatform.timeline(shipmentId),
    queryFn: () => trackingPlatformApi.timeline(shipmentId),
    enabled: !!shipmentId,
  });
}
