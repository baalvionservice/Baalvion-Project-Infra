/**
 * @file lib/maritime/feasibility.ts
 * @description Can this ship, carrying this equipment, actually sail this corridor?
 *
 * A distance is only half the answer. A corridor through the Panama Canal is closed
 * to a 400 m ULCV; one through Suez is closed to anything drawing more than ~20 m;
 * a port with 11 m alongside cannot take a neopanamax on her marks. This module
 * holds the published transit limits, the standard container-ship classes, and the
 * assessment that puts a corridor, a vessel class and the two ports together.
 *
 * SOURCES AND HONESTY. Canal and strait limits are the operators' own published
 * maxima. Vessel-class dimensions are the standard definitions of each class, not a
 * specific ship. Port draft is whatever the registry holds for that port and is
 * frequently absent — an absent limit yields "not on file", never an implied pass.
 *
 * Pure: no I/O. Safe on the server or in the browser.
 */
import type { SeaRoutePlan, Waypoint } from './sea-routes';

/** Standard container-ship classes, by the dimensions that define each class. */
export interface VesselClass {
  id: string;
  label: string;
  /** Nominal intake in TEU — the class's usual size, not a hard bound. */
  nominalTeu: number;
  loaM: number;
  beamM: number;
  /** Draft at summer marks, fully laden. */
  draftM: number;
  /** Height above the waterline when laden — the figure canal clearances are set against. */
  airDraftM: number;
  serviceSpeedKnots: number;
  note?: string;
}

export const VESSEL_CLASSES: readonly VesselClass[] = [
  { id: 'FEEDER', label: 'Feeder', nominalTeu: 1000, loaM: 150, beamM: 23, draftM: 9, airDraftM: 30, serviceSpeedKnots: 15, note: 'Short-sea and hub-and-spoke legs; reaches shallow and secondary ports.' },
  { id: 'FEEDERMAX', label: 'Feedermax', nominalTeu: 2500, loaM: 200, beamM: 30, draftM: 11, airDraftM: 35, serviceSpeedKnots: 16 },
  { id: 'PANAMAX', label: 'Panamax', nominalTeu: 4500, loaM: 294, beamM: 32.3, draftM: 12, airDraftM: 40, serviceSpeedKnots: 17, note: 'Sized to the original Panama locks.' },
  { id: 'POST_PANAMAX', label: 'Post-Panamax', nominalTeu: 6500, loaM: 300, beamM: 40, draftM: 13, airDraftM: 48, serviceSpeedKnots: 17 },
  { id: 'NEOPANAMAX', label: 'Neopanamax', nominalTeu: 14000, loaM: 366, beamM: 51.2, draftM: 15.2, airDraftM: 55, serviceSpeedKnots: 18, note: 'The largest box the expanded Panama locks accept.' },
  { id: 'ULCV', label: 'Ultra-large container vessel', nominalTeu: 23000, loaM: 400, beamM: 61.5, draftM: 16.5, airDraftM: 62, serviceSpeedKnots: 18, note: 'Asia-Europe trunk services; cannot transit Panama.' },
];

export const vesselClass = (id: string): VesselClass | undefined => VESSEL_CLASSES.find((v) => v.id === id);
export const DEFAULT_VESSEL_CLASS = 'NEOPANAMAX';

/** Published maxima for a transit. An absent field means the transit does not bind it. */
export interface TransitLimits {
  maxDraftM?: number;
  maxBeamM?: number;
  maxLoaM?: number;
  maxAirDraftM?: number;
  /** What the limit is and who sets it — shown verbatim next to a blocked transit. */
  basis: string;
}

/**
 * Transit limits by waypoint id. Only the transits that genuinely constrain a
 * container ship carry an entry; open water and unconstrained straits are omitted
 * so an absent entry is never mistaken for an unchecked one.
 */
export const TRANSIT_LIMITS: Record<string, TransitLimits> = {
  SUEZ: {
    maxDraftM: 20.1,
    maxBeamM: 77.5,
    maxAirDraftM: 68,
    basis: 'Suez Canal Authority published maxima (66 ft draft; beam and air draft per the Rules of Navigation).',
  },
  PANAMA: {
    maxDraftM: 15.2,
    maxBeamM: 51.25,
    maxLoaM: 366,
    maxAirDraftM: 57.91,
    basis: 'Panama Canal Authority neopanamax lock maxima (tropical fresh water).',
  },
  MALACCA_NW: {
    maxDraftM: 25,
    basis: 'Malacca Strait controlling depth — the "Malaccamax" limit; deeper ships route via Lombok.',
  },
  SINGAPORE_STRAIT: {
    maxDraftM: 25,
    basis: 'Malacca and Singapore Strait controlling depth.',
  },
  SUNDA: {
    maxDraftM: 20,
    basis: 'Sunda Strait controlling depth; Lombok is the deep-draft alternative.',
  },
};

export type FindingSeverity = 'BLOCKER' | 'WARNING' | 'UNKNOWN';

export interface FeasibilityFinding {
  severity: FindingSeverity;
  /** Where the constraint bites — a waypoint name or a port name. */
  at: string;
  title: string;
  detail: string;
}

export interface PortDraft {
  name: string;
  /** Deepest draft the port can work alongside, in metres. Absent = not on file. */
  maxDraftM?: number;
}

export interface FeasibilityReport {
  vessel: VesselClass;
  findings: FeasibilityFinding[];
  blockers: FeasibilityFinding[];
  warnings: FeasibilityFinding[];
  unknowns: FeasibilityFinding[];
  /** True when nothing on the corridor rules this vessel out. */
  passable: boolean;
  /** True when every constraint on the corridor could actually be checked. */
  fullyChecked: boolean;
}

const m = (value: number) => `${value} m`;
const article = (word: string) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

/** Every way a transit can rule a vessel out, checked against its published maxima. */
function checkTransit(waypoint: Waypoint, vessel: VesselClass): FeasibilityFinding[] {
  const limits = TRANSIT_LIMITS[waypoint.id];
  if (!limits) return [];

  const checks: [number | undefined, number, string, string][] = [
    [limits.maxDraftM, vessel.draftM, 'draft', 'laden draft'],
    [limits.maxBeamM, vessel.beamM, 'beam', 'beam'],
    [limits.maxLoaM, vessel.loaM, 'length overall', 'length overall'],
    [limits.maxAirDraftM, vessel.airDraftM, 'air draft', 'air draft'],
  ];

  const breaches = checks
    .filter(([limit, actual]) => limit != null && actual > limit)
    .map(([limit, actual, dimension]) => `${dimension} ${m(actual)} against a ${m(limit!)} maximum`);

  if (breaches.length === 0) return [];
  return [{
    severity: 'BLOCKER',
    at: waypoint.name,
    title: `${vessel.label} cannot transit the ${waypoint.name}`,
    detail: `${breaches.join('; ')}. ${limits.basis}`,
  }];
}

/** Whether a port can work the vessel alongside, or whether we simply do not know. */
function checkPort(port: PortDraft, vessel: VesselClass, role: string): FeasibilityFinding[] {
  if (port.maxDraftM == null) {
    return [{
      severity: 'UNKNOWN',
      at: port.name,
      title: `No draft on file for ${port.name}`,
      detail: `The registry holds no maximum draft for this ${role}, so a ${vessel.label} drawing ${m(vessel.draftM)} could not be checked against it. Confirm with the terminal before fixing the vessel.`,
    }];
  }
  // A shallow port does not make the corridor impossible: ships call part-loaded or on
  // a tide every day. That is a commercial consequence to surface, not a closure — a
  // BLOCKER is reserved for what a ship physically cannot do, like fit a canal lock.
  if (vessel.draftM > port.maxDraftM) {
    return [{
      severity: 'WARNING',
      at: port.name,
      title: `${port.name} cannot take ${article(vessel.label)} ${vessel.label} on her marks`,
      detail: `Laden draft is ${m(vessel.draftM)} against a port maximum of ${m(port.maxDraftM)}. The vessel must part-load, work a tidal window, or the call must move to a deeper terminal — all of which change the economics of the lane.`,
    }];
  }
  // Under-keel clearance is a pilotage call, but a margin this thin is worth saying.
  if (vessel.draftM > port.maxDraftM - 1) {
    return [{
      severity: 'WARNING',
      at: port.name,
      title: `Tight under-keel clearance at ${port.name}`,
      detail: `Laden draft ${m(vessel.draftM)} against a port maximum of ${m(port.maxDraftM)}. Expect a tidal window or a draft restriction on the call.`,
    }];
  }
  return [];
}

/**
 * Assess a planned corridor for one vessel class. Returns findings in severity order:
 * blockers (the corridor is closed to this ship), warnings (it is tight), and unknowns
 * (a constraint we could not check because the data is absent).
 */
export function assessFeasibility(
  plan: SeaRoutePlan,
  vesselClassId: string = DEFAULT_VESSEL_CLASS,
  ports: { origin: PortDraft; destination: PortDraft },
): FeasibilityReport {
  const vessel = vesselClass(vesselClassId) ?? vesselClass(DEFAULT_VESSEL_CLASS)!;

  const findings = [
    ...plan.path.flatMap((waypoint) => checkTransit(waypoint, vessel)),
    ...checkPort(ports.origin, vessel, 'load port'),
    ...checkPort(ports.destination, vessel, 'discharge port'),
  ];

  const blockers = findings.filter((f) => f.severity === 'BLOCKER');
  const warnings = findings.filter((f) => f.severity === 'WARNING');
  const unknowns = findings.filter((f) => f.severity === 'UNKNOWN');

  return {
    vessel,
    findings: [...blockers, ...warnings, ...unknowns],
    blockers,
    warnings,
    unknowns,
    passable: blockers.length === 0,
    fullyChecked: unknowns.length === 0,
  };
}

// -- Equipment-level checks ---------------------------------------------------

export interface EquipmentFinding {
  severity: FindingSeverity;
  equipment: string;
  title: string;
  detail: string;
}

/**
 * Equipment constraints that a lane imposes independently of the ship: reefer plugs
 * at both ends, 45 ft acceptance on the inland leg, out-of-gauge stow.
 */
export function assessEquipment(
  containerCodes: string[],
  ports: { origin: { name: string; reeferPlugs?: number }; destination: { name: string; reeferPlugs?: number } },
): EquipmentFinding[] {
  const findings: EquipmentFinding[] = [];
  const unique = [...new Set(containerCodes)];

  const reefers = unique.filter((code) => code.endsWith('RF') || code.endsWith('RH'));
  if (reefers.length > 0) {
    for (const [role, port] of [['load', ports.origin], ['discharge', ports.destination]] as const) {
      if (port.reeferPlugs == null) {
        findings.push({
          severity: 'UNKNOWN',
          equipment: reefers.join(', '),
          title: `Reefer capacity at the ${role} port is not on file`,
          detail: `${port.name} has no reefer plug count in the registry. Powered equipment needs a plug on the quay and a monitored slot on board — confirm with the terminal.`,
        });
      } else if (port.reeferPlugs === 0) {
        findings.push({
          severity: 'BLOCKER',
          equipment: reefers.join(', '),
          title: `${port.name} has no reefer plugs`,
          detail: 'Powered equipment cannot be handled at this port. Route the reefer through a terminal with plug capacity.',
        });
      }
    }
  }

  if (unique.includes('45HC')) {
    findings.push({
      severity: 'WARNING',
      equipment: '45HC',
      title: '45 ft equipment is not universally accepted',
      detail: 'Many inland hauliers and some terminals will not take a 45 ft box, and it is barred on parts of the European road network without a permit. Confirm the door leg before fixing the equipment.',
    });
  }

  const outOfGauge = unique.filter((code) => code.endsWith('OT') || code.endsWith('FR'));
  if (outOfGauge.length > 0) {
    findings.push({
      severity: 'WARNING',
      equipment: outOfGauge.join(', '),
      title: 'Out-of-gauge cargo is rated by stow, not by cube',
      detail: 'Open-top and flat-rack cargo needs the carrier to approve the stow, and over-height or over-width attracts a slot surcharge that a standard quote does not include.',
    });
  }

  return findings;
}
