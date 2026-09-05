/**
 * @file lib/maritime/feasibility.test.ts
 * @description Pins the transit and port checks against the constraints that actually
 * govern container shipping — the two canals, and a port too shallow for the ship.
 */
import { describe, it, expect } from 'vitest';
import seed from '@/server/gckb/seed-data.json';
import { planSeaRoute, planDoorToDoor, hubsOnCorridor, type RoutablePort } from './sea-routes';
import { assessFeasibility, assessEquipment, VESSEL_CLASSES } from './feasibility';

type SeedPort = { code: string; name: string; countryCode: string; attributes: Record<string, unknown> };

const PORTS = new Map<string, RoutablePort>(
  (seed.ports as SeedPort[]).map((p) => [
    p.code,
    {
      code: p.code,
      name: p.name,
      countryCode: p.countryCode,
      kind: p.attributes.kind as string,
      latitude: p.attributes.latitude as number,
      longitude: p.attributes.longitude as number,
      maxDraftM: p.attributes.maxDraftM as number | undefined,
      reeferPlugs: p.attributes.reeferPlugs as number | undefined,
    },
  ]),
);

const port = (code: string): RoutablePort => {
  const p = PORTS.get(code);
  if (!p) throw new Error(`seed data has no port ${code}`);
  return p;
};
const lookup = (code: string) => PORTS.get(code);
const drafts = (o: string, d: string) => ({
  origin: { name: port(o).name, maxDraftM: port(o).maxDraftM },
  destination: { name: port(d).name, maxDraftM: port(d).maxDraftM },
});

describe('vessel feasibility', () => {
  it('bars a ULCV from the Panama Canal but not from Suez', () => {
    const viaPanama = planSeaRoute(port('CNSHA'), port('USNYC'))!;
    expect(viaPanama.chokepoints.map((c) => c.id)).toContain('PANAMA');
    expect(assessFeasibility(viaPanama, 'ULCV', drafts('CNSHA', 'USNYC')).blockers.some((b) => b.at === 'Panama Canal')).toBe(true);

    // Suez takes 20.1 m of draft and 68 m of air draft; a ULCV is inside both.
    const viaSuez = planSeaRoute(port('CNSHA'), port('NLRTM'))!;
    expect(viaSuez.chokepoints.map((c) => c.id)).toContain('SUEZ');
    expect(assessFeasibility(viaSuez, 'ULCV', drafts('CNSHA', 'NLRTM')).blockers).toHaveLength(0);
  });

  it('lets a neopanamax through the canal a ULCV cannot use', () => {
    const plan = planSeaRoute(port('CNSHA'), port('USNYC'))!;
    expect(assessFeasibility(plan, 'NEOPANAMAX', drafts('CNSHA', 'USNYC')).passable).toBe(true);
  });

  it('reports one finding per transit, not one per breached dimension', () => {
    const plan = planSeaRoute(port('CNSHA'), port('USNYC'))!;
    const panama = assessFeasibility(plan, 'ULCV', drafts('CNSHA', 'USNYC')).blockers.filter((b) => b.at === 'Panama Canal');
    expect(panama).toHaveLength(1);
    expect(panama[0].detail).toMatch(/draft.*beam.*length overall/s);
  });

  it('warns — but does not close the corridor — when a port is too shallow', () => {
    // Durban works 12.8 m; a neopanamax draws 15.2 m laden. She can still call
    // part-loaded, so this is a commercial warning, not a physical closure.
    const plan = planSeaRoute(port('ZADUR'), port('NLRTM'))!;
    const report = assessFeasibility(plan, 'NEOPANAMAX', drafts('ZADUR', 'NLRTM'));
    expect(report.warnings.some((w) => w.at === 'Port of Durban')).toBe(true);
    expect(report.blockers).toHaveLength(0);
    expect(report.passable).toBe(true);

    // A feeder fits with room to spare and draws no finding at all.
    expect(assessFeasibility(plan, 'FEEDER', drafts('ZADUR', 'NLRTM')).findings.some((f) => f.at === 'Port of Durban')).toBe(false);
  });

  it('keeps a canal lock an absolute blocker, not a warning', () => {
    const plan = planSeaRoute(port('CNSHA'), port('USNYC'))!;
    const report = assessFeasibility(plan, 'ULCV', drafts('CNSHA', 'USNYC'));
    expect(report.blockers.map((b) => b.at)).toEqual(['Panama Canal']);
    expect(report.passable).toBe(false);
  });

  it('says a constraint is unchecked rather than implying it passed', () => {
    const plan = planSeaRoute(port('CNSHA'), port('MZBEW'))!;
    const report = assessFeasibility(plan, 'NEOPANAMAX', drafts('CNSHA', 'MZBEW'));
    expect(report.unknowns.some((u) => u.at === 'Port of Beira')).toBe(true);
    expect(report.fullyChecked).toBe(false);
  });

  it('every vessel class keeps air draft under the Suez clearance', () => {
    // Air draft is measured above the waterline; a class above 68 m would be barred
    // from a canal its ships transit daily.
    for (const vessel of VESSEL_CLASSES) expect(vessel.airDraftM).toBeLessThan(68);
  });
});

describe('equipment checks', () => {
  it('blocks a reefer into a port with no plugs and flags an unknown one', () => {
    const findings = assessEquipment(['40RH'], {
      origin: { name: 'A', reeferPlugs: 400 },
      destination: { name: 'B', reeferPlugs: 0 },
    });
    expect(findings.some((f) => f.severity === 'BLOCKER')).toBe(true);

    const unknown = assessEquipment(['20RF'], { origin: { name: 'A' }, destination: { name: 'B' } });
    expect(unknown.every((f) => f.severity === 'UNKNOWN')).toBe(true);
  });

  it('warns on 45 ft and out-of-gauge equipment', () => {
    const findings = assessEquipment(['45HC', '40FR'], { origin: { name: 'A' }, destination: { name: 'B' } });
    expect(findings.map((f) => f.equipment)).toEqual(['45HC', '40FR']);
  });

  it('says nothing about ordinary dry equipment', () => {
    expect(assessEquipment(['20GP', '40HC'], { origin: { name: 'A' }, destination: { name: 'B' } })).toHaveLength(0);
  });
});

describe('door-to-door corridors', () => {
  it('rails an inland ICD to the sea and barges the far end inland', () => {
    const plan = planDoorToDoor(port('INTKD'), port('DEDUI'), lookup)!;
    expect(plan).not.toBeNull();
    expect(plan.originLeg?.mode).toBe('RAIL');
    expect(plan.originLeg?.from.code).toBe('INTKD');
    expect(plan.destinationLeg?.mode).toBe('BARGE');
    // The on-carriage runs seaport to inland terminal, not the other way about.
    expect(plan.destinationLeg?.to.code).toBe('DEDUI');
    expect(plan.totalDays).toBeGreaterThan(plan.sea.transit.totalDays);
  });

  it('picks the gateway that shortens the whole corridor, not the nearest one', () => {
    // Delhi to Europe leaves through Mundra; the sea leg more than repays the longer rail run.
    expect(planDoorToDoor(port('INTKD'), port('NLRTM'), lookup)!.originLeg?.to.code).toBe('INMUN');
  });

  it('leaves a port-to-port corridor with no land legs', () => {
    const plan = planDoorToDoor(port('CNSHA'), port('NLRTM'), lookup)!;
    expect(plan.originLeg).toBeUndefined();
    expect(plan.destinationLeg).toBeUndefined();
    expect(plan.totalDays).toBe(plan.sea.transit.totalDays);
  });

  it('refuses an end that reaches neither the sea nor a gateway', () => {
    expect(planDoorToDoor(port('VIDP'), port('NLRTM'), lookup)).toBeNull();
    expect(planDoorToDoor(port('AZBAK'), port('NLRTM'), lookup)).toBeNull();
  });
});

describe('corridor hubs', () => {
  it('finds the hubs an Asia-Europe lane actually passes', () => {
    const hubs = hubsOnCorridor(port('CNSHA'), port('NLRTM'), lookup);
    expect(hubs.map((h) => h.hub.code)).toContain('SGSIN');
    for (const hub of hubs) expect(hub.detourPercent).toBeLessThanOrEqual(25);
  });

  it('never proposes either end of the corridor as its own hub', () => {
    const hubs = hubsOnCorridor(port('SGSIN'), port('NLRTM'), lookup);
    expect(hubs.map((h) => h.hub.code)).not.toContain('SGSIN');
    expect(hubs.map((h) => h.hub.code)).not.toContain('NLRTM');
  });
});
