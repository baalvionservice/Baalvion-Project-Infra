/**
 * @file src/services/port-network-service.ts
 * @description Client access to the global port network — the published GCKB
 * point-of-entry registry — and to the corridor planner that routes between two of
 * its ports.
 *
 * These read the platform's own public endpoints (`/api/gckb/public/*`), not
 * trade-service, so they need no session: the port registry is the same canonical
 * baseline the public directory renders. The directory is fetched once per page
 * load and memoised, because every picker, filter and corridor lookup works off
 * the same few hundred rows.
 */

export type PortKind = 'SEAPORT' | 'AIRPORT' | 'DRY_PORT' | 'ICD' | 'RAIL' | 'LAND_BORDER' | (string & {});

export interface NetworkPort {
  id: string;
  recordKey: string;
  code: string;
  name: string;
  kind?: PortKind;
  unlocode?: string;
  iata?: string;
  icao?: string;
  latitude?: number;
  longitude?: number;
  capacityNote?: string;
  // Operational depth. Absent means "not on file", never "unrestricted".
  maxDraftM?: number;
  quayLengthM?: number;
  berths?: number;
  terminals?: number;
  reeferPlugs?: number;
  annualTeu?: number;
  throughputYear?: number;
  railConnected?: boolean;
  timezone?: string;
  website?: string;
  countryCode: string;
  countryName: string;
  region: string;
  subregion: string;
  flagEmoji?: string;
}

export interface CorridorChokepoint {
  id: string;
  name: string;
  kind: string;
  note?: string;
}

export interface CorridorRoute {
  distanceNm: number;
  distanceKm: number;
  transitDays: number;
  seaDays: number;
  serviceSpeedKnots: number;
  direct: boolean;
  chokepoints: CorridorChokepoint[];
  legs: { from: string; to: string; nm: number }[];
  track: { name: string; latitude: number; longitude: number }[];
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
  inland: boolean;
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

export type FindingSeverity = 'BLOCKER' | 'WARNING' | 'UNKNOWN';

export interface FeasibilityFinding {
  severity: FindingSeverity;
  at: string;
  title: string;
  detail: string;
}

export interface EquipmentFinding {
  severity: FindingSeverity;
  equipment: string;
  title: string;
  detail: string;
}

export interface CorridorFeasibility {
  vessel: { id: string; label: string; nominalTeu: number; draftM: number; beamM: number; loaM: number; airDraftM: number };
  passable: boolean;
  fullyChecked: boolean;
  findings: FeasibilityFinding[];
  equipment: EquipmentFinding[];
}

export interface CorridorHub {
  code: string;
  name: string;
  countryName: string;
  detourPercent: number;
  inboundNm: number;
  outboundNm: number;
}

export interface VesselClassOption {
  id: string;
  label: string;
  nominalTeu: number;
  draftM: number;
  note?: string;
}

export interface Corridor {
  origin: CorridorEndpoint;
  destination: CorridorEndpoint;
  loadPort: CorridorEndpoint;
  dischargePort: CorridorEndpoint;
  originLeg?: InlandLegView;
  destinationLeg?: InlandLegView;
  route: CorridorRoute;
  alternative?: { avoided: string; route: CorridorRoute };
  feasibility: CorridorFeasibility;
  hubs: CorridorHub[];
  total: { distanceKm: number; days: number; doorToDoor: boolean };
  method: string;
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function readEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body?.success || body.data == null) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body.data;
}

let directoryPromise: Promise<NetworkPort[]> | null = null;

/** Every published port, country- and region-tagged. Memoised per page load. */
export function getPortNetwork(): Promise<NetworkPort[]> {
  if (!directoryPromise) {
    directoryPromise = fetch('/api/gckb/public/ports', { cache: 'no-store' })
      .then((res) => readEnvelope<{ items: NetworkPort[]; total: number }>(res))
      .then((data) => data.items)
      .catch((err) => {
        // A failed fetch must not poison every later call with a rejected promise.
        directoryPromise = null;
        throw err;
      });
  }
  return directoryPromise;
}

/** Ports a vessel can actually be booked from — the rest are air, rail or inland. */
export const isSeaport = (port: NetworkPort): boolean => port.kind === 'SEAPORT';

/**
 * Inland terminals the corridor planner can reach the sea from. Kept in step with
 * `INLAND_GATEWAYS` in lib/maritime/sea-routes — an inland port not listed there is
 * offered nowhere, because the planner would refuse it.
 */
const INLAND_GATEWAY_CODES = new Set([
  'INTKD', 'DEDUI', 'NLVEN', 'ES-COSLADA', 'CN-XIAN-ITL', 'PL-MALASZEWICZE', 'KZ-KHORGOS', 'ZA-CITYDEEP',
]);

/** Every point of entry that can anchor a corridor: a seaport, or an inland terminal with a gateway. */
export const isRoutable = (port: NetworkPort): boolean => isSeaport(port) || INLAND_GATEWAY_CODES.has(port.code);

export interface RegionGroup {
  region: string;
  countries: { countryCode: string; countryName: string; flagEmoji?: string; ports: NetworkPort[] }[];
  portCount: number;
}

/** Group ports region then country, both alphabetical — the shape the pickers render. */
export function groupByRegion(ports: NetworkPort[]): RegionGroup[] {
  const regions = new Map<string, Map<string, NetworkPort[]>>();
  for (const port of ports) {
    if (!regions.has(port.region)) regions.set(port.region, new Map());
    const countries = regions.get(port.region)!;
    if (!countries.has(port.countryCode)) countries.set(port.countryCode, []);
    countries.get(port.countryCode)!.push(port);
  }

  return [...regions.entries()]
    .map(([region, countries]) => ({
      region,
      portCount: [...countries.values()].reduce((n, list) => n + list.length, 0),
      countries: [...countries.entries()]
        .map(([countryCode, list]) => ({
          countryCode,
          countryName: list[0].countryName,
          flagEmoji: list[0].flagEmoji,
          ports: [...list].sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.countryName.localeCompare(b.countryName)),
    }))
    .sort((a, b) => a.region.localeCompare(b.region));
}

/** Free-text match across the fields a planner would actually type. */
export function matchesQuery(port: NetworkPort, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [port.name, port.code, port.unlocode, port.iata, port.icao, port.countryName, port.countryCode, port.subregion]
    .some((value) => value?.toLowerCase().includes(q));
}

export interface CorridorOptions {
  serviceSpeedKnots?: number;
  portDays?: number;
  /** Vessel class the corridor is checked against. */
  vesselClassId?: string;
  /** Container equipment codes, for the equipment-level checks. */
  equipment?: string[];
}

let vesselClassPromise: Promise<VesselClassOption[]> | null = null;

/** Container-ship classes a corridor can be checked against. Static; fetched once. */
export function getVesselClasses(): Promise<VesselClassOption[]> {
  if (!vesselClassPromise) {
    vesselClassPromise = fetch('/api/gckb/public/vessel-classes')
      .then((res) => readEnvelope<{ items: VesselClassOption[] }>(res))
      .then((data) => data.items)
      .catch((err) => {
        vesselClassPromise = null;
        throw err;
      });
  }
  return vesselClassPromise;
}

/** Route between two registry ports. Throws with the server's reason if unroutable. */
export async function planCorridor(originCode: string, destinationCode: string, options: CorridorOptions = {}): Promise<Corridor> {
  const params = new URLSearchParams({ origin: originCode, destination: destinationCode });
  if (options.serviceSpeedKnots) params.set('speedKnots', String(options.serviceSpeedKnots));
  if (options.portDays != null) params.set('portDays', String(options.portDays));
  if (options.vesselClassId) params.set('vesselClass', options.vesselClassId);
  if (options.equipment?.length) params.set('equipment', options.equipment.join(','));

  const res = await fetch(`/api/gckb/public/corridor?${params.toString()}`, { cache: 'no-store' });
  return readEnvelope<Corridor>(res);
}
