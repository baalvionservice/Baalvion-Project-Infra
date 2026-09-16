/**
 * @file lib/maritime/sea-routes.test.ts
 * @description Holds the corridor planner to published port-to-port distances.
 *
 * The waypoint network is hand-built, so the failure mode that matters is a leg or
 * hub edit that quietly bends a major trade lane. Each case below pins a real
 * corridor against its charted distance with a 15% band — wide enough for the
 * great-circle-between-waypoints approximation, tight enough that a wrong turn
 * (a Suez routing that detours through the Gulf of Guinea, say) fails.
 */
import { describe, it, expect } from 'vitest';
import seed from '@/server/gckb/seed-data.json';
import { planSeaRoute, compareSeaRoutes, basinForPort, type RoutablePort } from './sea-routes';

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
    },
  ]),
);

const port = (code: string): RoutablePort => {
  const p = PORTS.get(code);
  if (!p) throw new Error(`seed data has no port ${code}`);
  return p;
};

/** [origin, destination, charted distance in nautical miles]. */
const CORRIDORS: ReadonlyArray<readonly [string, string, number]> = [
  ['CNSHA', 'NLRTM', 10500],
  ['SGSIN', 'NLRTM', 8300],
  ['INNSA', 'NLRTM', 6400],
  ['CNSHA', 'USLAX', 5700],
  ['CNSHA', 'USNYC', 10500],
  ['ZADUR', 'NLRTM', 6900],
  ['BRSSZ', 'NLRTM', 5200],
  ['AEJEA', 'NLRTM', 6500],
  ['AUMEL', 'CNSHA', 5000],
  ['KRPUS', 'USLGB', 5500],
  ['CNSHA', 'GBFXT', 10800],
  ['SGSIN', 'AUSYD', 4300],
  ['USNYC', 'GBFXT', 3200],
  ['CLSAI', 'CNSHA', 10300],
  ['EGPSD', 'INNSA', 3000],
];

describe('sea-routes corridor planner', () => {
  it.each(CORRIDORS)('routes %s to %s within 15%% of the charted distance', (origin, destination, charted) => {
    const plan = planSeaRoute(port(origin), port(destination));
    expect(plan).not.toBeNull();
    expect(Math.abs(plan!.distanceNm - charted) / charted).toBeLessThan(0.15);
  });

  it('sends Asia to Europe through Suez, and the diversion around the Cape', () => {
    const comparison = compareSeaRoutes(port('CNSHA'), port('NLRTM'));
    expect(comparison?.primary.chokepoints.map((c) => c.id)).toContain('SUEZ');

    // Closing Suez must still leave a corridor, and a longer one.
    const diverted = planSeaRoute(port('CNSHA'), port('NLRTM'), { avoid: ['SUEZ'] });
    expect(diverted).not.toBeNull();
    expect(diverted!.distanceNm).toBeGreaterThan(comparison!.primary.distanceNm);
  });

  it('keeps a same-basin hop direct instead of routing it out to an ocean hub', () => {
    const plan = planSeaRoute(port('USLAX'), port('USOAK'));
    expect(plan?.direct).toBe(true);
    expect(plan!.distanceNm).toBeLessThan(500);
  });

  it('reaches every seaport in the registry', () => {
    const hub = port('NLRTM');
    const unreachable = (seed.ports as SeedPort[])
      .filter((p) => p.attributes.kind === 'SEAPORT' && p.code !== 'NLRTM')
      .filter((p) => !planSeaRoute(port(p.code), hub))
      .map((p) => p.code);

    // Baku is on the Caspian, which has no navigable link to any ocean.
    expect(unreachable).toEqual(['AZBAK']);
  });

  it('refuses to route a facility that is not a seaport', () => {
    expect(basinForPort(port('VIDP'))).toBeNull();
    expect(planSeaRoute(port('VIDP'), port('NLRTM'))).toBeNull();
  });
});
