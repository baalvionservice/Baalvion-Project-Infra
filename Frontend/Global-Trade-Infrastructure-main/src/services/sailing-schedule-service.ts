/**
 * @file sailing-schedule-service.ts
 * @description Sailing schedules — vessels, voyages and dated port calls, read from
 * trade-service's /sailing_schedules surface (migration 065). Every figure here comes
 * from a stored schedule row; when a lane has no sailing on file the API says so in
 * `note` and this service passes that through rather than inventing a route.
 */
import { apiClient } from '@/lib/api-client';
import { toList } from '@/lib/api-list';

export interface Vessel {
  id: string;
  name: string;
  imoNumber: string | null;
  vesselType: string;
  flagCountry: string | null;
  operatorName: string | null;
  carrierCode: string | null;
  capacityTeu: number | null;
  serviceSpeedKnots: number | null;
  yearBuilt: number | null;
  dataSource: string;
}

export interface PortCall {
  id: string;
  voyageId: string;
  sequence: number;
  portCode: string;
  portName: string | null;
  countryCode: string | null;
  terminal: string | null;
  callType: 'load' | 'discharge' | 'both' | 'transit';
  eta: string | null;
  etd: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  status: 'scheduled' | 'arrived' | 'working' | 'departed' | 'skipped' | 'cancelled';
  cutoffAt: string | null;
  /** Measured against the published ETA once the ship actually arrives. */
  delayHours: number | null;
  dataSource: string;
  voyage?: Voyage;
}

export interface Voyage {
  id: string;
  voyageNumber: string;
  serviceName: string | null;
  direction: string | null;
  status: string;
  originPortCode: string | null;
  destinationPortCode: string | null;
  departureDate: string | null;
  arrivalDate: string | null;
  dataSource: string;
  vessel?: Vessel;
  portCalls?: PortCall[];
}

export interface TransitEstimate {
  days: number | null;
  hours: number | null;
  /** 'schedule' = read from real published dates; 'estimated' = distance/speed fallback. */
  basis: 'schedule' | 'estimated' | 'unknown';
  distanceNm: number | null;
  note: string | null;
}

export interface Sailing {
  voyage: Voyage;
  loadCall: PortCall;
  dischargeCall: PortCall;
  transit: TransitEstimate;
}

export interface LaneSearchResult {
  sailings: Sailing[];
  lane: { fromPort: string; toPort: string };
  note: string | null;
}

/** One vessel ride inside an itinerary: board at `loadCall`, come off at `dischargeCall`. */
export interface RouteLeg {
  voyage: Voyage;
  loadCall: PortCall;
  dischargeCall: PortCall;
  departure: string | null;
  arrival: string | null;
  transitDays: number | null;
}

/** The wait at a hub between two legs — where a box sits still, and where it can miss the boat. */
export interface RouteConnection {
  portCode: string;
  portName: string | null;
  arrival: string | null;
  departure: string | null;
  waitHours: number;
  waitDays: number;
  fromVoyage: string;
  toVoyage: string;
}

export interface SailingRoute {
  legs: RouteLeg[];
  /** 0 = direct. Each transhipment is one hub where the cargo changes vessel. */
  transhipments: number;
  transhipmentPorts: string[];
  connections: RouteConnection[];
  departure: string | null;
  arrival: string | null;
  totalTransitDays: number | null;
  totalTransitHours: number | null;
  /** Always 'schedule' — every leg comes from real port-call dates, never an estimate. */
  basis: 'schedule';
}

export interface RouteSearchResult {
  lane: { fromPort: string; toPort: string };
  params: {
    maxLegs: number;
    minConnectionHours: number;
    maxConnectionDays: number;
    departFrom: string;
    departTo: string;
  };
  routes: SailingRoute[];
  directCount: number;
  transhipmentCount: number;
  note: string | null;
}

export interface VesselPosition {
  vessel: Vessel;
  state: 'in_port' | 'at_sea' | 'unknown';
  currentCall: PortCall | null;
  lastDeparted: PortCall | null;
  nextCall: PortCall | null;
}

export interface ShipmentSchedule {
  shipmentId: string;
  shipmentNo: string | null;
  booked: boolean;
  note?: string;
  voyage?: Voyage;
  loadCall?: PortCall | null;
  dischargeCall?: PortCall | null;
  vesselPosition?: VesselPosition | null;
  estimatedDeparture: string | null;
  estimatedArrival: string | null;
  vesselName?: string | null;
  voyageNo?: string | null;
}

export const sailingScheduleService = {
  /** Direct sailings connecting two ports, with transit read from the real dates. */
  async searchLane(fromPort: string, toPort: string, departFrom?: string, departTo?: string): Promise<LaneSearchResult> {
    const res = await apiClient.get<LaneSearchResult>('/sailing_schedules/search', {
      from: fromPort, to: toPort, depart_from: departFrom, depart_to: departTo,
    });
    return res.data || { sailings: [], lane: { fromPort, toPort }, note: res.error?.message || null };
  },

  /**
   * Itineraries between two ports INCLUDING transhipment — ride one vessel to a hub,
   * change, ride another onward. Direct sailings come back as the zero-transhipment
   * case, so this is a superset of searchLane().
   */
  async findRoutes(
    fromPort: string,
    toPort: string,
    opts: {
      departFrom?: string;
      departTo?: string;
      maxLegs?: number;
      minConnectionHours?: number;
      maxConnectionDays?: number;
    } = {},
  ): Promise<RouteSearchResult> {
    const res = await apiClient.get<RouteSearchResult>('/sailing_schedules/routes', {
      from: fromPort,
      to: toPort,
      depart_from: opts.departFrom,
      depart_to: opts.departTo,
      max_legs: opts.maxLegs,
      min_connection_hours: opts.minConnectionHours,
      max_connection_days: opts.maxConnectionDays,
    });
    return res.data || {
      lane: { fromPort, toPort },
      params: { maxLegs: 0, minConnectionHours: 0, maxConnectionDays: 0, departFrom: '', departTo: '' },
      routes: [], directCount: 0, transhipmentCount: 0,
      note: res.error?.message || null,
    };
  },

  async departures(portCode: string, from?: string, to?: string): Promise<PortCall[]> {
    const res = await apiClient.get<PortCall[]>('/sailing_schedules/departures', { port: portCode, from, to });
    return res.data || [];
  },

  async arrivals(portCode: string, from?: string, to?: string): Promise<PortCall[]> {
    const res = await apiClient.get<PortCall[]>('/sailing_schedules/arrivals', { port: portCode, from, to });
    return res.data || [];
  },

  async listVessels(search?: string): Promise<Vessel[]> {
    const res = await apiClient.get<{ items: Vessel[] }>('/sailing_schedules/vessels', { search, limit: 50 });
    return toList<Vessel>(res as any);
  },

  async vesselPosition(vesselId: string): Promise<VesselPosition | null> {
    const res = await apiClient.get<VesselPosition>(`/sailing_schedules/vessels/${vesselId}/position`);
    return res.success ? (res.data ?? null) : null;
  },

  async getVoyage(voyageId: string): Promise<Voyage | null> {
    const res = await apiClient.get<Voyage>(`/sailing_schedules/voyages/${voyageId}`);
    return res.success ? (res.data ?? null) : null;
  },

  /** Where one shipment's cargo is: its sailing, its two stops, and the vessel's position. */
  async shipmentSchedule(shipmentId: string): Promise<ShipmentSchedule | null> {
    const res = await apiClient.get<ShipmentSchedule>(`/sailing_schedules/shipments/${shipmentId}`);
    return res.success ? (res.data ?? null) : null;
  },

  /** The caller's own shipments (tenant-scoped by the backend), newest first. */
  async myShipments(): Promise<Array<{ id: string; shipment_no: string; origin_port: string | null; destination_port: string | null; status: string; voyage_id: string | null }>> {
    const res = await apiClient.get<{ items: any[] }>('/dashboard/shipments', { limit: 50 });
    return res.data?.items || [];
  },
};
