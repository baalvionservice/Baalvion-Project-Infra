/**
 * @file server/gckb/corridor.ts
 * @description Resolves a corridor between two registry points of entry: the ocean
 * passage, the inland legs either side of it, whether a given vessel class can
 * actually sail it, and which transhipment hubs it passes.
 *
 * The planner (`lib/maritime/*`) is pure and knows nothing about the database; this
 * module is the seam between it and the registry, so a corridor is always computed
 * from the same port records the directory and the booking flow display — never from
 * coordinates typed into a form.
 */
import { NotFoundError, ValidationError } from '../db/errors';
import { listPortsDirectory, type DirectoryPort } from './public-read';
import {
  planSeaRoute,
  planDoorToDoor,
  compareSeaRoutes,
  hubsOnCorridor,
  inlandGatewayFor,
  basinForPort,
  DEFAULT_SERVICE_SPEED_KNOTS,
  type SeaRoutePlan,
  type RoutablePort,
  type InlandLeg,
} from '@/lib/maritime/sea-routes';
import {
  assessFeasibility,
  assessEquipment,
  vesselClass,
  DEFAULT_VESSEL_CLASS,
  type FeasibilityFinding,
  type EquipmentFinding,
} from '@/lib/maritime/feasibility';

export interface CorridorRequest {
  originCode: string;
  destinationCode: string;
  /** Vessel service speed in knots; the planner's default when omitted. */
  serviceSpeedKnots?: number;
  portDays?: number;
  /** Vessel class the corridor is checked against. */
  vesselClassId?: string;
  /** Container equipment codes, for the equipment-level checks. */
  equipment?: string[];
  /** Tenant whose registry corrections should override the baseline, when known. */
  organizationId?: string | null;
}

export interface CorridorEndpoint {
  code: string;
  name: string;
  kind?: string;
  countryCode: string;
  countryName: string;
  region: string;
  subregion: string;
  unlocode?: string;
  latitude: number;
  longitude: number;
  maxDraftM?: number;
  railConnected?: boolean;
  reeferPlugs?: number;
  /** True when this is an inland terminal reached over land, not a seaport. */
  inland: boolean;
}

export interface CorridorRouteView {
  distanceNm: number;
  distanceKm: number;
  transitDays: number;
  seaDays: number;
  serviceSpeedKnots: number;
  direct: boolean;
  chokepoints: { id: string; name: string; kind: string; note?: string }[];
  legs: { from: string; to: string; nm: number }[];
  /** Every point on the corridor, origin first — enough to draw the polyline. */
  track: { name: string; latitude: number; longitude: number }[];
}

export interface InlandLegView {
  fromCode: string;
  fromName: string;
  toCode: string;
  toName: string;
  mode: string;
  distanceKm: number;
  days: number;
  note: string;
}

export interface CorridorFeasibility {
  vessel: { id: string; label: string; nominalTeu: number; draftM: number; beamM: number; loaM: number; airDraftM: number };
  passable: boolean;
  fullyChecked: boolean;
  findings: FeasibilityFinding[];
  equipment: EquipmentFinding[];
}

export interface CorridorHubView {
  code: string;
  name: string;
  countryName: string;
  detourPercent: number;
  inboundNm: number;
  outboundNm: number;
}

export interface CorridorView {
  origin: CorridorEndpoint;
  destination: CorridorEndpoint;
  /** Sea end of each side. Differs from origin/destination on a door-to-door corridor. */
  loadPort: CorridorEndpoint;
  dischargePort: CorridorEndpoint;
  originLeg?: InlandLegView;
  destinationLeg?: InlandLegView;
  route: CorridorRouteView;
  /** The best routing that avoids the canal the primary uses, when there is one. */
  alternative?: { avoided: string; route: CorridorRouteView };
  feasibility: CorridorFeasibility;
  /** Transhipment hubs the corridor passes — where to look for a real relay sailing. */
  hubs: CorridorHubView[];
  /** Total including the land legs. Equals the sea figures on a port-to-port corridor. */
  total: { distanceKm: number; days: number; doorToDoor: boolean };
  method: string;
}

const METHOD =
  'Estimated over a maritime waypoint network (great-circle legs between canals, straits and ocean hubs), ' +
  'with inland legs scaled from the straight line by mode. Not a charted distance and not a published ' +
  'schedule: no weather routing, traffic separation schemes, tides or carrier service patterns.';

function toEndpoint(port: DirectoryPort): CorridorEndpoint {
  return {
    code: port.code ?? port.recordKey,
    name: port.name,
    kind: port.kind,
    countryCode: port.countryCode,
    countryName: port.countryName,
    region: port.region,
    subregion: port.subregion,
    unlocode: port.unlocode,
    latitude: port.latitude!,
    longitude: port.longitude!,
    maxDraftM: port.maxDraftM,
    railConnected: port.railConnected,
    reeferPlugs: port.reeferPlugs,
    inland: port.kind !== 'SEAPORT',
  };
}

function toRoutable(port: DirectoryPort): RoutablePort {
  return {
    code: port.code ?? port.recordKey,
    name: port.name,
    countryCode: port.countryCode,
    kind: port.kind,
    latitude: port.latitude!,
    longitude: port.longitude!,
    maxDraftM: port.maxDraftM,
    reeferPlugs: port.reeferPlugs,
  };
}

function toRouteView(plan: SeaRoutePlan): CorridorRouteView {
  return {
    distanceNm: plan.distanceNm,
    distanceKm: plan.distanceKm,
    transitDays: plan.transit.totalDays,
    seaDays: plan.transit.seaDays,
    serviceSpeedKnots: plan.transit.serviceSpeedKnots,
    direct: plan.direct,
    chokepoints: plan.chokepoints.map((c) => ({ id: c.id, name: c.name, kind: c.kind, note: c.note })),
    legs: plan.legs.map((l) => ({ from: l.from, to: l.to, nm: l.nm })),
    track: [
      { name: plan.origin.name, latitude: plan.origin.latitude, longitude: plan.origin.longitude },
      ...plan.path.map((w) => ({ name: w.name, latitude: w.latitude, longitude: w.longitude })),
      { name: plan.destination.name, latitude: plan.destination.latitude, longitude: plan.destination.longitude },
    ],
  };
}

function toInlandView(leg: InlandLeg): InlandLegView {
  return {
    fromCode: leg.from.code,
    fromName: leg.from.name,
    toCode: leg.to.code,
    toName: leg.to.name,
    mode: leg.mode,
    distanceKm: leg.distanceKm,
    days: leg.days,
    note: leg.note,
  };
}

/**
 * Why a point of entry cannot anchor a corridor. Airports and land crossings are real
 * registry records but have no ocean route and no inland gateway to one.
 */
function unroutableReason(port: DirectoryPort): string | null {
  if (basinForPort(toRoutable(port))) return null;
  if (inlandGatewayFor(port.code ?? port.recordKey)) return null;
  const kind = (port.kind ?? 'facility').replace(/_/g, ' ').toLowerCase();
  return `${port.name} is ${/^[aeiou]/.test(kind) ? 'an' : 'a'} ${kind} with no sea corridor and no inland gateway on file, so it cannot be an end of an ocean booking.`;
}

/** Plan the corridor between two registry points of entry, by their registry code. */
export async function planCorridor(request: CorridorRequest): Promise<CorridorView> {
  const origin = request.originCode.trim().toUpperCase();
  const destination = request.destinationCode.trim().toUpperCase();
  if (origin === destination) throw new ValidationError('Origin and destination must be different ports');

  const ports = await listPortsDirectory(request.organizationId ?? null);
  const byCode = new Map(ports.map((p) => [(p.code ?? p.recordKey).toUpperCase(), p]));
  const from = byCode.get(origin);
  const to = byCode.get(destination);
  if (!from) throw new NotFoundError('PORT', origin);
  if (!to) throw new NotFoundError('PORT', destination);
  if (from.latitude == null || from.longitude == null) throw new ValidationError(`${from.name} has no coordinates on record`);
  if (to.latitude == null || to.longitude == null) throw new ValidationError(`${to.name} has no coordinates on record`);

  for (const port of [from, to]) {
    const reason = unroutableReason(port);
    if (reason) throw new ValidationError(reason);
  }

  const options = {
    serviceSpeedKnots: request.serviceSpeedKnots ?? DEFAULT_SERVICE_SPEED_KNOTS,
    portDays: request.portDays,
  };

  const lookup = (code: string): RoutablePort | undefined => {
    const port = byCode.get(code.toUpperCase());
    return port && port.latitude != null && port.longitude != null ? toRoutable(port) : undefined;
  };

  const doorToDoor = planDoorToDoor(toRoutable(from), toRoutable(to), lookup, options);
  if (!doorToDoor) {
    throw new ValidationError(
      `No corridor connects ${from.name} and ${to.name}. Both ends must reach connected waters, directly or through an inland gateway.`,
    );
  }

  const { sea, originLeg, destinationLeg } = doorToDoor;
  const loadPort = byCode.get(sea.origin.code.toUpperCase()) ?? from;
  const dischargePort = byCode.get(sea.destination.code.toUpperCase()) ?? to;

  // The canal-free alternative is a property of the sea passage, so it is compared
  // between the load and discharge ports, not the door-to-door endpoints.
  const comparison = compareSeaRoutes(toRoutable(loadPort), toRoutable(dischargePort), options);

  const feasibilityReport = assessFeasibility(sea, request.vesselClassId ?? DEFAULT_VESSEL_CLASS, {
    origin: { name: loadPort.name, maxDraftM: loadPort.maxDraftM },
    destination: { name: dischargePort.name, maxDraftM: dischargePort.maxDraftM },
  });

  const equipmentFindings = assessEquipment(request.equipment ?? [], {
    origin: { name: loadPort.name, reeferPlugs: loadPort.reeferPlugs },
    destination: { name: dischargePort.name, reeferPlugs: dischargePort.reeferPlugs },
  });

  const hubs = hubsOnCorridor(toRoutable(loadPort), toRoutable(dischargePort), lookup, options).map((hub) => ({
    code: hub.hub.code,
    name: hub.hub.name,
    countryName: byCode.get(hub.hub.code.toUpperCase())?.countryName ?? '—',
    detourPercent: hub.detourPercent,
    inboundNm: hub.inbound.distanceNm,
    outboundNm: hub.outbound.distanceNm,
  }));

  const v = feasibilityReport.vessel;

  return {
    origin: toEndpoint(from),
    destination: toEndpoint(to),
    loadPort: toEndpoint(loadPort),
    dischargePort: toEndpoint(dischargePort),
    originLeg: originLeg ? toInlandView(originLeg) : undefined,
    destinationLeg: destinationLeg ? toInlandView(destinationLeg) : undefined,
    route: toRouteView(sea),
    alternative: comparison?.alternative
      ? { avoided: comparison.alternative.avoided.name, route: toRouteView(comparison.alternative.plan) }
      : undefined,
    feasibility: {
      vessel: { id: v.id, label: v.label, nominalTeu: v.nominalTeu, draftM: v.draftM, beamM: v.beamM, loaM: v.loaM, airDraftM: v.airDraftM },
      passable: feasibilityReport.passable,
      fullyChecked: feasibilityReport.fullyChecked,
      findings: feasibilityReport.findings,
      equipment: equipmentFindings,
    },
    hubs,
    total: {
      distanceKm: doorToDoor.totalDistanceKm,
      days: doorToDoor.totalDays,
      doorToDoor: Boolean(originLeg || destinationLeg),
    },
    method: METHOD,
  };
}

/** Vessel classes a corridor can be checked against, for the UI's selector. */
export function listVesselClasses() {
  return [
    'FEEDER', 'FEEDERMAX', 'PANAMAX', 'POST_PANAMAX', 'NEOPANAMAX', 'ULCV',
  ].map((id) => {
    const v = vesselClass(id)!;
    return { id: v.id, label: v.label, nominalTeu: v.nominalTeu, draftM: v.draftM, note: v.note };
  });
}
