/**
 * @file lib/maritime/sea-routes.ts
 * @description Ocean corridor planner: turns an origin/destination port pair from
 * the GCKB point-of-entry registry into a navigable route — distance, the canals
 * and straits it transits, and a transit-time estimate.
 *
 * WHY A WAYPOINT NETWORK. A straight great-circle line between two ports runs
 * through continents (Shanghai to Rotterdam "direct" is ~8,000 nm across Asia and
 * is meaningless). Real routing software solves a graph of navigable water. This
 * module is that graph, hand-built from the corridors ocean carriers actually
 * sail: ~50 nodes (canals, straits, capes and open-water hubs, at their real
 * coordinates) joined by the legs vessels use, with Dijkstra over great-circle
 * leg lengths.
 *
 * WHAT IT IS NOT. This is a planning estimate, not a navigational product. Legs
 * are great-circle approximations between fixed waypoints, so a computed distance
 * runs a few percent under a charted route and carries no bathymetry, traffic
 * separation scheme, weather routing, draft or air-draft check. Never present a
 * number from here as a charted distance — the UI labels it as an estimate.
 *
 * Pure: no I/O, no DOM, no Prisma. Safe to import from a route handler, a server
 * component or the browser.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export type WaypointKind = 'CANAL' | 'STRAIT' | 'CAPE' | 'OPEN_WATER';

export interface Waypoint extends GeoPoint {
  id: string;
  name: string;
  kind: WaypointKind;
  /** Why a corridor goes through here — surfaced in the UI leg list. */
  note?: string;
}

const EARTH_RADIUS_NM = 3440.065;
const NM_TO_KM = 1.852;

/** Great-circle distance in nautical miles. */
export function distanceNm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const nmToKm = (nm: number): number => nm * NM_TO_KM;

// -- The navigable network ----------------------------------------------------

const W = (id: string, name: string, kind: WaypointKind, latitude: number, longitude: number, note?: string): Waypoint =>
  ({ id, name, kind, latitude, longitude, note });

export const WAYPOINTS: readonly Waypoint[] = [
  // Canals — the two that reshape global distance.
  W('SUEZ', 'Suez Canal', 'CANAL', 30.5, 32.35, 'Mediterranean to Red Sea; the Asia-Europe short cut'),
  W('PANAMA', 'Panama Canal', 'CANAL', 9.1, -79.7, 'Caribbean to eastern Pacific; draft- and slot-constrained'),

  // Straits and capes.
  W('BAB_EL_MANDEB', 'Bab-el-Mandeb', 'STRAIT', 12.58, 43.33, 'Red Sea to Gulf of Aden'),
  W('HORMUZ', 'Strait of Hormuz', 'STRAIT', 26.57, 56.25, 'Persian Gulf to Gulf of Oman'),
  W('GIBRALTAR', 'Strait of Gibraltar', 'STRAIT', 35.95, -5.6, 'Mediterranean to North Atlantic'),
  W('BOSPHORUS', 'Bosphorus', 'STRAIT', 41.12, 29.06, 'Sea of Marmara to Black Sea'),
  W('DARDANELLES', 'Dardanelles', 'STRAIT', 40.2, 26.4, 'Aegean to Sea of Marmara'),
  W('DOVER', 'Strait of Dover', 'STRAIT', 51.0, 1.5, 'English Channel to North Sea'),
  W('SKAGERRAK', 'Danish Straits', 'STRAIT', 57.6, 9.5, 'North Sea to Baltic'),
  W('MALACCA_NW', 'Malacca Strait (north-west approach)', 'STRAIT', 5.5, 97.8, 'Andaman Sea to Malacca Strait'),
  W('SINGAPORE_STRAIT', 'Singapore Strait', 'STRAIT', 1.2, 103.9, 'Malacca Strait to South China Sea'),
  W('SUNDA', 'Sunda Strait', 'STRAIT', -5.9, 105.9, 'Java Sea to Indian Ocean'),
  W('LOMBOK', 'Lombok Strait', 'STRAIT', -8.75, 115.85, 'Deep-draft alternative to Malacca'),
  W('TAIWAN_STRAIT', 'Taiwan Strait', 'STRAIT', 24.5, 119.5, 'South China Sea to East China Sea'),
  W('LUZON_STRAIT', 'Luzon Strait', 'STRAIT', 20.5, 121.0, 'South China Sea to Philippine Sea'),
  W('KOREA_STRAIT', 'Korea Strait', 'STRAIT', 34.3, 129.2, 'East China Sea to Sea of Japan'),
  W('FLORIDA_STRAIT', 'Straits of Florida', 'STRAIT', 24.5, -81.0, 'Gulf of Mexico to North Atlantic'),
  W('YUCATAN', 'Yucatan Channel', 'STRAIT', 21.5, -86.0, 'Gulf of Mexico to Caribbean'),
  W('TORRES', 'Torres Strait', 'STRAIT', -10.5, 142.5, 'Coral Sea to Arafura Sea'),
  W('BASS', 'Bass Strait', 'STRAIT', -39.5, 146.0, 'Tasman Sea to Great Australian Bight'),
  W('MAGELLAN', 'Strait of Magellan', 'STRAIT', -53.5, -70.5, 'South Atlantic to South Pacific'),
  W('GOOD_HOPE', 'Cape of Good Hope', 'CAPE', -34.9, 19.9, 'South Atlantic to Indian Ocean; the Suez bypass'),
  W('CAPE_HORN', 'Cape Horn', 'CAPE', -56.0, -67.3, 'South Atlantic to South Pacific'),

  // Open-water hubs — one or more per ocean basin; ports join the network here.
  W('ECS', 'East China Sea', 'OPEN_WATER', 31.0, 124.0),
  W('JP_PACIFIC', 'Japan Pacific coast', 'OPEN_WATER', 34.5, 140.0),
  W('JAPAN_SEA', 'Sea of Japan', 'OPEN_WATER', 40.0, 133.0),
  W('SCS', 'South China Sea', 'OPEN_WATER', 13.0, 113.0),
  W('MALACCA', 'Malacca Strait', 'OPEN_WATER', 3.0, 100.5),
  W('JAVA', 'Java Sea', 'OPEN_WATER', -5.5, 110.0),
  W('ANDAMAN', 'Andaman Sea', 'OPEN_WATER', 12.0, 95.0),
  W('ARAFURA', 'Arafura Sea', 'OPEN_WATER', -9.0, 133.0),
  W('PHILIPPINE_SEA', 'Philippine Sea', 'OPEN_WATER', 12.0, 130.0),
  W('BENGAL', 'Bay of Bengal', 'OPEN_WATER', 15.0, 87.0),
  W('SRI_LANKA', 'South of Sri Lanka', 'OPEN_WATER', 5.5, 80.5),
  W('ARABIAN', 'Arabian Sea', 'OPEN_WATER', 18.0, 64.0),
  W('GULF', 'Persian Gulf', 'OPEN_WATER', 26.5, 52.0),
  W('OMAN', 'Gulf of Oman', 'OPEN_WATER', 24.0, 58.5),
  W('ADEN', 'Gulf of Aden', 'OPEN_WATER', 12.5, 47.5),
  W('RED_SEA', 'Red Sea', 'OPEN_WATER', 20.0, 38.5),
  W('MED_E', 'Eastern Mediterranean', 'OPEN_WATER', 34.0, 29.0),
  W('MED_C', 'Central Mediterranean', 'OPEN_WATER', 36.0, 16.0),
  W('MED_W', 'Western Mediterranean', 'OPEN_WATER', 37.5, 3.0),
  W('BLACK_SEA', 'Black Sea', 'OPEN_WATER', 43.5, 33.0),
  W('NORTH_SEA', 'North Sea', 'OPEN_WATER', 55.0, 4.0),
  W('BALTIC', 'Baltic Sea', 'OPEN_WATER', 56.5, 18.5),
  W('ATL_NE', 'North-east Atlantic', 'OPEN_WATER', 46.0, -10.0),
  W('ATL_NW', 'North-west Atlantic', 'OPEN_WATER', 36.0, -72.0),
  W('ATL_N', 'North Atlantic track', 'OPEN_WATER', 48.0, -40.0),
  W('CHANNEL_W', 'Western Channel approach', 'OPEN_WATER', 49.5, -5.5),
  W('ATL_EQ', 'Equatorial Atlantic', 'OPEN_WATER', 0.0, -18.0),
  W('ATL_SE', 'South-east Atlantic', 'OPEN_WATER', -20.0, 3.0),
  W('ATL_C', 'Central Atlantic', 'OPEN_WATER', 5.0, -25.0),
  W('ATL_S', 'South Atlantic', 'OPEN_WATER', -33.0, 0.0),
  W('ATL_SW', 'South-west Atlantic', 'OPEN_WATER', -25.0, -42.0),
  W('GOM', 'Gulf of Mexico', 'OPEN_WATER', 26.0, -90.0),
  W('CARIBBEAN', 'Caribbean Sea', 'OPEN_WATER', 14.5, -75.0),
  W('W_AFRICA', 'Gulf of Guinea', 'OPEN_WATER', 2.0, 3.0),
  W('ANGOLA', 'Angola Basin', 'OPEN_WATER', -12.0, 9.0),
  W('SAFRICA_W', 'Cape west coast', 'OPEN_WATER', -34.0, 16.5),
  W('SAFRICA_E', 'Agulhas and Natal coast', 'OPEN_WATER', -31.0, 33.0),
  W('IO_SW', 'Mozambique Channel', 'OPEN_WATER', -20.0, 45.0),
  W('IO_C', 'Central Indian Ocean', 'OPEN_WATER', -8.0, 72.0),
  W('IO_E', 'South-east Indian Ocean', 'OPEN_WATER', -20.0, 100.0),
  W('IO_S', 'Southern Indian Ocean', 'OPEN_WATER', -37.0, 60.0),
  W('PAC_NE', 'North-east Pacific', 'OPEN_WATER', 40.0, -135.0),
  W('PAC_N', 'North Pacific', 'OPEN_WATER', 45.0, -175.0),
  W('ALEUTIAN', 'Aleutian approach', 'OPEN_WATER', 52.0, -170.0),
  W('HAWAII', 'Hawaiian Islands', 'OPEN_WATER', 21.0, -158.0),
  W('PAC_CAM', 'Eastern Pacific (Central America)', 'OPEN_WATER', 12.0, -95.0),
  W('PAC_SE', 'South-east Pacific', 'OPEN_WATER', -20.0, -80.0),
  W('PAC_C', 'Central South Pacific', 'OPEN_WATER', -10.0, -140.0),
  W('CORAL', 'Coral Sea', 'OPEN_WATER', -15.0, 155.0),
  W('AUS_E', 'Australian east coast', 'OPEN_WATER', -33.0, 153.0),
  W('AUS_S', 'Great Australian Bight', 'OPEN_WATER', -38.0, 138.0),
  W('AUS_W', 'Australian west coast', 'OPEN_WATER', -25.0, 112.0),
  W('TASMAN', 'Tasman Sea', 'OPEN_WATER', -38.0, 167.0),
  W('NZ', 'New Zealand coast', 'OPEN_WATER', -37.5, 175.5),
];

const WAYPOINT_BY_ID = new Map(WAYPOINTS.map((w) => [w.id, w]));

/** Navigable legs. Undirected; leg length is the great-circle between endpoints. */
const LEGS: ReadonlyArray<readonly [string, string]> = [
  ['ECS', 'KOREA_STRAIT'], ['KOREA_STRAIT', 'JP_PACIFIC'], ['KOREA_STRAIT', 'JAPAN_SEA'],
  ['ECS', 'TAIWAN_STRAIT'], ['TAIWAN_STRAIT', 'SCS'], ['SCS', 'LUZON_STRAIT'], ['LUZON_STRAIT', 'JP_PACIFIC'],
  ['LUZON_STRAIT', 'PHILIPPINE_SEA'], ['PHILIPPINE_SEA', 'JP_PACIFIC'], ['PHILIPPINE_SEA', 'CORAL'], ['PHILIPPINE_SEA', 'ECS'],
  ['JP_PACIFIC', 'PAC_N'], ['PAC_N', 'ALEUTIAN'], ['ALEUTIAN', 'PAC_NE'], ['PAC_N', 'PAC_NE'],
  ['JP_PACIFIC', 'HAWAII'], ['HAWAII', 'PAC_NE'], ['HAWAII', 'PAC_C'],
  ['SCS', 'SINGAPORE_STRAIT'], ['SINGAPORE_STRAIT', 'MALACCA'], ['MALACCA', 'MALACCA_NW'], ['MALACCA_NW', 'ANDAMAN'],
  ['SCS', 'JAVA'], ['SINGAPORE_STRAIT', 'JAVA'], ['JAVA', 'ARAFURA'], ['ARAFURA', 'TORRES'], ['JAVA', 'SUNDA'], ['SUNDA', 'IO_E'], ['JAVA', 'LOMBOK'], ['LOMBOK', 'IO_E'],
  ['ANDAMAN', 'BENGAL'], ['ANDAMAN', 'IO_C'], ['BENGAL', 'SRI_LANKA'], ['SRI_LANKA', 'ARABIAN'], ['SRI_LANKA', 'IO_C'],
  ['ARABIAN', 'IO_C'], ['ARABIAN', 'OMAN'], ['OMAN', 'HORMUZ'], ['HORMUZ', 'GULF'],
  ['ARABIAN', 'ADEN'], ['ADEN', 'BAB_EL_MANDEB'], ['BAB_EL_MANDEB', 'RED_SEA'], ['RED_SEA', 'SUEZ'], ['SUEZ', 'MED_E'],
  ['MED_E', 'MED_C'], ['MED_C', 'MED_W'], ['MED_W', 'GIBRALTAR'], ['GIBRALTAR', 'ATL_NE'],
  ['MED_E', 'DARDANELLES'], ['MED_C', 'DARDANELLES'], ['DARDANELLES', 'BOSPHORUS'], ['BOSPHORUS', 'BLACK_SEA'],
  ['ATL_NE', 'CHANNEL_W'], ['ATL_N', 'CHANNEL_W'], ['CHANNEL_W', 'DOVER'], ['DOVER', 'NORTH_SEA'],
  ['ATL_NW', 'ATL_N'], ['ATL_N', 'ATL_NE'], ['NORTH_SEA', 'SKAGERRAK'], ['SKAGERRAK', 'BALTIC'],
  ['ATL_NE', 'ATL_NW'], ['ATL_NE', 'ATL_C'], ['ATL_C', 'ATL_NW'], ['ATL_C', 'CARIBBEAN'], ['ATL_C', 'ATL_SW'],
  ['ATL_C', 'W_AFRICA'], ['W_AFRICA', 'ANGOLA'], ['ANGOLA', 'SAFRICA_W'],
  ['ATL_C', 'ATL_EQ'], ['ATL_EQ', 'ATL_NE'], ['ATL_EQ', 'W_AFRICA'], ['ATL_EQ', 'ATL_SE'],
  ['ATL_SE', 'ANGOLA'], ['ATL_SE', 'SAFRICA_W'], ['SAFRICA_W', 'GOOD_HOPE'], ['GOOD_HOPE', 'SAFRICA_E'],
  ['ATL_SW', 'ATL_S'], ['ATL_S', 'SAFRICA_W'], ['ATL_S', 'GOOD_HOPE'],
  ['ATL_SW', 'MAGELLAN'], ['MAGELLAN', 'PAC_SE'], ['ATL_SW', 'CAPE_HORN'], ['CAPE_HORN', 'PAC_SE'],
  ['ATL_NW', 'FLORIDA_STRAIT'], ['FLORIDA_STRAIT', 'GOM'], ['GOM', 'YUCATAN'], ['YUCATAN', 'CARIBBEAN'], ['ATL_NW', 'CARIBBEAN'],
  ['CARIBBEAN', 'PANAMA'], ['PANAMA', 'PAC_CAM'], ['PAC_CAM', 'PAC_NE'], ['PAC_CAM', 'PAC_SE'], ['PAC_CAM', 'PAC_C'],
  ['PAC_SE', 'PAC_C'], ['PAC_C', 'CORAL'], ['CORAL', 'AUS_E'], ['CORAL', 'TORRES'], ['TORRES', 'AUS_W'],
  ['SAFRICA_E', 'IO_SW'], ['IO_SW', 'IO_C'], ['IO_SW', 'ADEN'], ['SAFRICA_E', 'IO_S'], ['IO_S', 'AUS_W'], ['IO_S', 'IO_C'],
  ['IO_C', 'IO_E'], ['IO_E', 'AUS_W'],
  ['AUS_W', 'AUS_S'], ['AUS_S', 'BASS'], ['BASS', 'AUS_E'], ['AUS_E', 'TASMAN'], ['TASMAN', 'NZ'], ['NZ', 'PAC_C'],
];

interface Edge {
  to: string;
  nm: number;
}

const GRAPH: Map<string, Edge[]> = (() => {
  const g = new Map<string, Edge[]>();
  const add = (from: string, to: string) => {
    const a = WAYPOINT_BY_ID.get(from);
    const b = WAYPOINT_BY_ID.get(to);
    if (!a || !b) throw new Error(`sea-routes: leg references unknown waypoint ${from} to ${to}`);
    if (!g.has(from)) g.set(from, []);
    g.get(from)!.push({ to, nm: distanceNm(a, b) });
  };
  for (const [a, b] of LEGS) {
    add(a, b);
    add(b, a);
  }
  return g;
})();

// -- Basins: how a port joins the network -------------------------------------

/** Ocean basin a port sits on. A basin lists the waypoints a vessel sails to from it. */
export type BasinId =
  | 'EAST_CHINA_SEA' | 'JAPAN_PACIFIC' | 'JAPAN_SEA' | 'SOUTH_CHINA_SEA' | 'MALACCA' | 'JAVA_SEA'
  | 'ANDAMAN' | 'BAY_OF_BENGAL' | 'ARABIAN_SEA' | 'PERSIAN_GULF' | 'GULF_OF_OMAN' | 'GULF_OF_ADEN'
  | 'RED_SEA' | 'MEDITERRANEAN' | 'BLACK_SEA' | 'NORTH_SEA' | 'BALTIC' | 'ATLANTIC_NE' | 'ATLANTIC_NW'
  | 'GULF_OF_MEXICO' | 'CARIBBEAN' | 'ATLANTIC_SW' | 'WEST_AFRICA' | 'SOUTH_AFRICA' | 'INDIAN_OCEAN_SW'
  | 'PACIFIC_NE' | 'PACIFIC_C_AMERICA' | 'PACIFIC_SE' | 'AUSTRALIA_EAST' | 'AUSTRALIA_WEST'
  | 'NEW_ZEALAND' | 'SOUTH_PACIFIC' | 'HAWAII' | 'CASPIAN';

export const BASINS: Record<BasinId, { name: string; entries: string[] }> = {
  EAST_CHINA_SEA: { name: 'East China Sea', entries: ['ECS', 'TAIWAN_STRAIT', 'KOREA_STRAIT'] },
  JAPAN_PACIFIC: { name: 'Japan (Pacific coast)', entries: ['JP_PACIFIC', 'KOREA_STRAIT'] },
  JAPAN_SEA: { name: 'Sea of Japan', entries: ['JAPAN_SEA'] },
  SOUTH_CHINA_SEA: { name: 'South China Sea', entries: ['SCS', 'SINGAPORE_STRAIT', 'TAIWAN_STRAIT'] },
  MALACCA: { name: 'Malacca Strait', entries: ['SINGAPORE_STRAIT', 'MALACCA'] },
  JAVA_SEA: { name: 'Java Sea', entries: ['JAVA'] },
  ANDAMAN: { name: 'Andaman Sea', entries: ['ANDAMAN'] },
  BAY_OF_BENGAL: { name: 'Bay of Bengal', entries: ['BENGAL', 'SRI_LANKA'] },
  ARABIAN_SEA: { name: 'Arabian Sea', entries: ['ARABIAN', 'SRI_LANKA'] },
  PERSIAN_GULF: { name: 'Persian Gulf', entries: ['GULF'] },
  GULF_OF_OMAN: { name: 'Gulf of Oman', entries: ['OMAN', 'ARABIAN'] },
  GULF_OF_ADEN: { name: 'Gulf of Aden', entries: ['ADEN'] },
  RED_SEA: { name: 'Red Sea', entries: ['RED_SEA'] },
  MEDITERRANEAN: { name: 'Mediterranean', entries: ['MED_E', 'MED_C', 'MED_W'] },
  BLACK_SEA: { name: 'Black Sea', entries: ['BLACK_SEA'] },
  NORTH_SEA: { name: 'North Sea', entries: ['NORTH_SEA', 'DOVER'] },
  BALTIC: { name: 'Baltic Sea', entries: ['BALTIC'] },
  ATLANTIC_NE: { name: 'North-east Atlantic', entries: ['ATL_NE', 'GIBRALTAR', 'CHANNEL_W', 'DOVER'] },
  ATLANTIC_NW: { name: 'North-west Atlantic', entries: ['ATL_NW', 'ATL_N', 'FLORIDA_STRAIT'] },
  GULF_OF_MEXICO: { name: 'Gulf of Mexico', entries: ['GOM'] },
  CARIBBEAN: { name: 'Caribbean Sea', entries: ['CARIBBEAN', 'PANAMA', 'YUCATAN'] },
  ATLANTIC_SW: { name: 'South-west Atlantic', entries: ['ATL_SW'] },
  WEST_AFRICA: { name: 'West Africa', entries: ['W_AFRICA', 'ANGOLA'] },
  SOUTH_AFRICA: { name: 'Southern Africa (Atlantic)', entries: ['SAFRICA_W', 'GOOD_HOPE'] },
  INDIAN_OCEAN_SW: { name: 'South-west Indian Ocean', entries: ['SAFRICA_E', 'IO_SW'] },
  PACIFIC_NE: { name: 'North-east Pacific', entries: ['PAC_NE'] },
  PACIFIC_C_AMERICA: { name: 'Eastern Pacific (Central America)', entries: ['PAC_CAM', 'PANAMA'] },
  PACIFIC_SE: { name: 'South-east Pacific', entries: ['PAC_SE'] },
  AUSTRALIA_EAST: { name: 'Australia (east)', entries: ['AUS_E', 'BASS', 'CORAL'] },
  AUSTRALIA_WEST: { name: 'Australia (west and north)', entries: ['AUS_W', 'TORRES'] },
  NEW_ZEALAND: { name: 'New Zealand', entries: ['NZ'] },
  SOUTH_PACIFIC: { name: 'South Pacific islands', entries: ['CORAL'] },
  HAWAII: { name: 'Hawaii', entries: ['HAWAII'] },
  // Landlocked sea: no navigable link to any ocean. Kept so Baku resolves to an
  // explicit "no ocean route" answer instead of a silently wrong one.
  CASPIAN: { name: 'Caspian Sea', entries: [] },
};

/** Default basin per country. Ports on a second coastline are corrected below. */
const COUNTRY_BASIN: Record<string, BasinId> = {
  CN: 'EAST_CHINA_SEA', HK: 'SOUTH_CHINA_SEA', TW: 'SOUTH_CHINA_SEA', KR: 'EAST_CHINA_SEA', JP: 'JAPAN_PACIFIC',
  SG: 'MALACCA', MY: 'MALACCA', TH: 'SOUTH_CHINA_SEA', VN: 'SOUTH_CHINA_SEA', ID: 'JAVA_SEA',
  PH: 'SOUTH_CHINA_SEA', KH: 'SOUTH_CHINA_SEA', MM: 'ANDAMAN', BN: 'SOUTH_CHINA_SEA',
  IN: 'ARABIAN_SEA', PK: 'ARABIAN_SEA', BD: 'BAY_OF_BENGAL', LK: 'ARABIAN_SEA', MV: 'ARABIAN_SEA', IR: 'PERSIAN_GULF',
  AE: 'PERSIAN_GULF', SA: 'RED_SEA', OM: 'GULF_OF_OMAN', QA: 'PERSIAN_GULF', KW: 'PERSIAN_GULF',
  BH: 'PERSIAN_GULF', IQ: 'PERSIAN_GULF', JO: 'RED_SEA', IL: 'MEDITERRANEAN', TR: 'MEDITERRANEAN',
  AZ: 'CASPIAN', GE: 'BLACK_SEA',
  NL: 'NORTH_SEA', BE: 'NORTH_SEA', DE: 'NORTH_SEA', FR: 'NORTH_SEA', GB: 'NORTH_SEA', IE: 'ATLANTIC_NE',
  ES: 'MEDITERRANEAN', PT: 'ATLANTIC_NE', IT: 'MEDITERRANEAN', GR: 'MEDITERRANEAN', MT: 'MEDITERRANEAN',
  HR: 'MEDITERRANEAN', SI: 'MEDITERRANEAN', CY: 'MEDITERRANEAN',
  PL: 'BALTIC', SE: 'BALTIC', FI: 'BALTIC', EE: 'BALTIC', LV: 'BALTIC', LT: 'BALTIC',
  DK: 'NORTH_SEA', NO: 'NORTH_SEA', IS: 'ATLANTIC_NE', RU: 'BALTIC', UA: 'BLACK_SEA', RO: 'BLACK_SEA',
  EG: 'MEDITERRANEAN', MA: 'MEDITERRANEAN', DZ: 'MEDITERRANEAN', TN: 'MEDITERRANEAN', SD: 'RED_SEA', DJ: 'GULF_OF_ADEN',
  NG: 'WEST_AFRICA', GH: 'WEST_AFRICA', CI: 'WEST_AFRICA', SN: 'WEST_AFRICA', TG: 'WEST_AFRICA',
  BJ: 'WEST_AFRICA', CM: 'WEST_AFRICA', CG: 'WEST_AFRICA', AO: 'WEST_AFRICA',
  KE: 'INDIAN_OCEAN_SW', TZ: 'INDIAN_OCEAN_SW', MU: 'INDIAN_OCEAN_SW', MZ: 'INDIAN_OCEAN_SW',
  ZA: 'SOUTH_AFRICA', NA: 'SOUTH_AFRICA',
  US: 'ATLANTIC_NW', CA: 'ATLANTIC_NW', MX: 'PACIFIC_C_AMERICA', PA: 'CARIBBEAN', CR: 'CARIBBEAN',
  GT: 'CARIBBEAN', DO: 'CARIBBEAN', JM: 'CARIBBEAN', TT: 'CARIBBEAN', PR: 'CARIBBEAN', BS: 'ATLANTIC_NW',
  CO: 'CARIBBEAN', VE: 'CARIBBEAN', BR: 'ATLANTIC_SW', AR: 'ATLANTIC_SW', UY: 'ATLANTIC_SW',
  CL: 'PACIFIC_SE', PE: 'PACIFIC_SE', EC: 'PACIFIC_SE',
  AU: 'AUSTRALIA_EAST', NZ: 'NEW_ZEALAND', PG: 'SOUTH_PACIFIC', FJ: 'SOUTH_PACIFIC',
};

/** Ports whose coastline differs from their country's default (two-coast states). */
const PORT_BASIN: Record<string, BasinId> = {
  // China / Taiwan / Japan: south of the Taiwan Strait is a different sea.
  CNSZX: 'SOUTH_CHINA_SEA', CNYTN: 'SOUTH_CHINA_SEA', CNCAN: 'SOUTH_CHINA_SEA', CNZHA: 'SOUTH_CHINA_SEA',
  CNXMN: 'SOUTH_CHINA_SEA', CNFOC: 'SOUTH_CHINA_SEA', TWKEL: 'EAST_CHINA_SEA', TWTXG: 'EAST_CHINA_SEA',
  JPHKT: 'EAST_CHINA_SEA', RUVVO: 'JAPAN_SEA', RUNVS: 'BLACK_SEA',
  // South-east Asia.
  MYBTU: 'SOUTH_CHINA_SEA', MYKUA: 'SOUTH_CHINA_SEA', IDBLW: 'MALACCA',
  // India's two coasts.
  INMAA: 'BAY_OF_BENGAL', INENR: 'BAY_OF_BENGAL', INVTZ: 'BAY_OF_BENGAL', INCCU: 'BAY_OF_BENGAL',
  INTUT: 'BAY_OF_BENGAL', INIXZ: 'BAY_OF_BENGAL',
  // Gulf vs. Red Sea vs. Gulf of Oman.
  AEFJR: 'GULF_OF_OMAN', SADMM: 'PERSIAN_GULF', SAJUB: 'PERSIAN_GULF', EGSUZ: 'RED_SEA', EGSOK: 'RED_SEA',
  // Europe: Mediterranean and Atlantic frontages.
  FRMRS: 'MEDITERRANEAN', GBSOU: 'ATLANTIC_NE', GBLIV: 'ATLANTIC_NE', ESBIO: 'ATLANTIC_NE', ESLPA: 'ATLANTIC_NE',
  MACAS: 'ATLANTIC_NE', DKCPH: 'BALTIC', TRGEM: 'MEDITERRANEAN',
  // Southern Africa: the Cape divides Atlantic from Indian Ocean.
  ZADUR: 'INDIAN_OCEAN_SW', ZARCB: 'INDIAN_OCEAN_SW',
  // The Americas: Gulf, Pacific and Caribbean coasts.
  USHOU: 'GULF_OF_MEXICO', USMSY: 'GULF_OF_MEXICO', USMOB: 'GULF_OF_MEXICO',
  USLAX: 'PACIFIC_NE', USLGB: 'PACIFIC_NE', USOAK: 'PACIFIC_NE', USSEA: 'PACIFIC_NE', USTIW: 'PACIFIC_NE',
  USANC: 'PACIFIC_NE', USHNL: 'HAWAII',
  CAVAN: 'PACIFIC_NE', CAPRR: 'PACIFIC_NE',
  MXVER: 'GULF_OF_MEXICO', MXATM: 'GULF_OF_MEXICO', MXPGO: 'GULF_OF_MEXICO',
  PABLB: 'PACIFIC_C_AMERICA', CRCAL: 'PACIFIC_C_AMERICA', GTPRQ: 'PACIFIC_C_AMERICA', COBUN: 'PACIFIC_SE',
  // Australia's west and north coast.
  AUFRE: 'AUSTRALIA_WEST', AUPHE: 'AUSTRALIA_WEST', AUDRW: 'AUSTRALIA_WEST',
};

/**
 * Ports that sit ON a chokepoint rather than out in their basin. Without this a
 * Port Said sailing is measured out to the eastern Mediterranean and back to a
 * canal it is already alongside.
 */
const PORT_ENTRIES: Record<string, string[]> = {
  EGPSD: ['SUEZ', 'MED_E'],
  EGDAM: ['MED_E', 'SUEZ'],
  EGSUZ: ['SUEZ', 'RED_SEA'],
  EGSOK: ['SUEZ', 'RED_SEA'],
  ESALG: ['GIBRALTAR', 'MED_W'],
  MAPTM: ['GIBRALTAR', 'MED_W'],
  TRAMB: ['BOSPHORUS', 'DARDANELLES'],
  TRGEM: ['DARDANELLES', 'BOSPHORUS'],
};

/** The waypoints a vessel can sail to directly from this port. */
function entryWaypoints(port: RoutablePort, basin: BasinId): string[] {
  return PORT_ENTRIES[port.code] ?? BASINS[basin].entries;
}

export interface RoutablePort extends GeoPoint {
  code: string;
  name: string;
  countryCode: string;
  kind?: string;
  /** Deepest draft the port works alongside, in metres. Absent = not on file. */
  maxDraftM?: number;
  /** Reefer plug positions on the terminal. Absent = not on file. */
  reeferPlugs?: number;
}

// -- Inland gateways: how a dry port reaches the sea ---------------------------

export type InlandMode = 'RAIL' | 'BARGE' | 'ROAD';

interface InlandGateway {
  /** Seaports this facility is served from, best first. */
  gateways: string[];
  mode: InlandMode;
  note: string;
}

/**
 * Inland terminals and the seaports that actually serve them. These are real
 * corridors — a block train or a barge rotation someone operates — not "the nearest
 * port by distance", which is how you end up routing Delhi's cargo through Karachi.
 */
const INLAND_GATEWAYS: Record<string, InlandGateway> = {
  INTKD: { gateways: ['INNSA', 'INMUN'], mode: 'RAIL', note: 'Block trains to the Jawaharlal Nehru and Mundra gateways.' },
  DEDUI: { gateways: ['NLRTM', 'BEANR'], mode: 'BARGE', note: 'Rhine barge rotations to the Rotterdam and Antwerp terminals.' },
  NLVEN: { gateways: ['NLRTM', 'BEANR'], mode: 'BARGE', note: 'Maas and canal barge shuttles to the deep-sea terminals.' },
  'ES-COSLADA': { gateways: ['ESVLC', 'ESBCN', 'ESBIO'], mode: 'RAIL', note: 'Rail shuttles from Madrid to the Mediterranean and Atlantic gateways.' },
  'CN-XIAN-ITL': { gateways: ['CNLYG', 'CNTAO', 'CNSHA'], mode: 'RAIL', note: 'Rail to the eastern seaboard gateways; also the western end of the China-Europe block trains.' },
  'PL-MALASZEWICZE': { gateways: ['PLGDN', 'PLGDY'], mode: 'RAIL', note: 'Rail onward to the Baltic gateways after the broad-gauge transfer.' },
  'KZ-KHORGOS': { gateways: ['CNLYG'], mode: 'RAIL', note: 'The Lianyungang-Khorgos rail corridor across Kazakhstan and western China.' },
  'ZA-CITYDEEP': { gateways: ['ZADUR', 'ZAPLZ'], mode: 'RAIL', note: 'Transnet rail corridor from the Gauteng inland terminal to the coast.' },
};

/**
 * Straight-line to route-distance factors, and planning speeds. A railway does not
 * run down a great circle, so the geometric distance is scaled before it is turned
 * into transit days. Both are planning figures and the UI says so.
 */
const INLAND_DETOUR: Record<InlandMode, number> = { RAIL: 1.25, BARGE: 1.35, ROAD: 1.3 };
const INLAND_KM_PER_DAY: Record<InlandMode, number> = { RAIL: 400, BARGE: 250, ROAD: 500 };

/** Whether this facility reaches the sea over land, and how. */
export const inlandGatewayFor = (code: string): InlandGateway | undefined => INLAND_GATEWAYS[code];

/**
 * Ports that operate as transhipment hubs: where a box comes off one vessel and
 * waits for another. Used to suggest an indirect routing when a lane has no
 * plausible direct service.
 */
export const TRANSHIPMENT_HUBS: readonly string[] = [
  'SGSIN', 'MYTPP', 'MYPKG', 'HKHKG', 'TWKHH', 'KRPUS', 'CNNGB',
  'AEJEA', 'OMSLL', 'LKCMB',
  'MAPTM', 'ESALG', 'ESVLC', 'MTMAR', 'GRPIR', 'ITGIT', 'EGPSD',
  'NLRTM', 'BEANR',
  'PAMIT', 'PACTB', 'DOCAU', 'JMKIN', 'BSFPO',
];

/** The basin a port sails from, or null if it is not a maritime facility. */
export function basinForPort(port: RoutablePort): BasinId | null {
  if (port.kind && port.kind !== 'SEAPORT') return null;
  return PORT_BASIN[port.code] ?? COUNTRY_BASIN[port.countryCode] ?? null;
}

// -- Route planning -----------------------------------------------------------

export interface RouteLeg {
  from: string;
  to: string;
  nm: number;
  /** Waypoint the leg ends at — absent on the final leg into the destination port. */
  waypoint?: Waypoint;
}

export interface TransitEstimate {
  serviceSpeedKnots: number;
  seaDays: number;
  /** Canal convoy time, in hours. */
  canalHours: number;
  portDays: number;
  totalDays: number;
}

export interface SeaRoutePlan {
  origin: RoutablePort;
  destination: RoutablePort;
  originBasin: BasinId;
  destinationBasin: BasinId;
  distanceNm: number;
  distanceKm: number;
  legs: RouteLeg[];
  path: Waypoint[];
  /** Canals, straits and capes the corridor transits, in order. */
  chokepoints: Waypoint[];
  transit: TransitEstimate;
  /** True when both ports sit on the same basin and the corridor is a direct run. */
  direct: boolean;
}

export interface RouteOptions {
  /** Vessel service speed in knots. Container services typically run 14-20. */
  serviceSpeedKnots?: number;
  /** Terminal dwell either end, in days. */
  portDays?: number;
  /** Waypoint ids the corridor must avoid — e.g. ['SUEZ'] for a Cape routing. */
  avoid?: string[];
}

export const DEFAULT_SERVICE_SPEED_KNOTS = 16.5;
const DEFAULT_PORT_DAYS = 2;

/** Convoy transit time for the canals, in hours. Included in the transit estimate. */
const CANAL_HOURS: Record<string, number> = { SUEZ: 14, PANAMA: 10 };

const ORIGIN_NODE = ' origin';
const DEST_NODE = ' destination';

/** Dijkstra over the waypoint graph, with the two ports attached to their basins. */
function shortestPath(
  origin: RoutablePort,
  destination: RoutablePort,
  originEntries: string[],
  destEntries: string[],
  blocked: Set<string>,
): { path: string[]; nm: number } | null {
  const destEntrySet = new Set(destEntries.filter((id) => !blocked.has(id)));

  const neighbours = (node: string): Edge[] => {
    if (node === ORIGIN_NODE) {
      return originEntries
        .filter((id) => !blocked.has(id))
        .map((id) => ({ to: id, nm: distanceNm(origin, WAYPOINT_BY_ID.get(id)!) }));
    }
    if (node === DEST_NODE) return [];
    const out = (GRAPH.get(node) ?? []).filter((e) => !blocked.has(e.to));
    if (destEntrySet.has(node)) out.push({ to: DEST_NODE, nm: distanceNm(WAYPOINT_BY_ID.get(node)!, destination) });
    return out;
  };

  const dist = new Map<string, number>([[ORIGIN_NODE, 0]]);
  const prev = new Map<string, string>();
  const settled = new Set<string>();
  // The graph is ~50 nodes, so a linear scan for the frontier minimum beats the
  // bookkeeping of a heap and keeps this dependency-free.
  const queue = new Set<string>([ORIGIN_NODE]);

  while (queue.size > 0) {
    let node: string | null = null;
    let best = Infinity;
    for (const candidate of queue) {
      const d = dist.get(candidate) ?? Infinity;
      if (d < best) {
        best = d;
        node = candidate;
      }
    }
    if (node === null) break;
    queue.delete(node);
    settled.add(node);
    if (node === DEST_NODE) break;

    for (const edge of neighbours(node)) {
      if (settled.has(edge.to)) continue;
      const next = best + edge.nm;
      if (next < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, next);
        prev.set(edge.to, node);
        queue.add(edge.to);
      }
    }
  }

  if (!dist.has(DEST_NODE)) return null;
  const path: string[] = [];
  for (let node: string | undefined = DEST_NODE; node !== undefined; node = prev.get(node)) {
    path.unshift(node);
    if (node === ORIGIN_NODE) break;
  }
  return { path: path.slice(1, -1), nm: dist.get(DEST_NODE)! };
}

/**
 * Plan an ocean corridor between two ports. Returns null when either end is not a
 * seaport, or when no navigable path exists (a Caspian port, say).
 */
export function planSeaRoute(origin: RoutablePort, destination: RoutablePort, options: RouteOptions = {}): SeaRoutePlan | null {
  const originBasin = basinForPort(origin);
  const destinationBasin = basinForPort(destination);
  if (!originBasin || !destinationBasin) return null;

  const speed = options.serviceSpeedKnots ?? DEFAULT_SERVICE_SPEED_KNOTS;
  const portDays = options.portDays ?? DEFAULT_PORT_DAYS;
  const blocked = new Set(options.avoid ?? []);

  let path: Waypoint[] = [];
  let nm: number;
  let direct = false;

  // Within one basin a vessel sails port to port; routing through a hub would
  // invent a detour (Los Angeles to Oakland must not run out to 40N 135W).
  if (originBasin === destinationBasin) {
    nm = distanceNm(origin, destination);
    direct = true;
  } else {
    const solved = shortestPath(origin, destination, entryWaypoints(origin, originBasin), entryWaypoints(destination, destinationBasin), blocked);
    if (!solved) return null;
    path = solved.path.map((id) => WAYPOINT_BY_ID.get(id)!);
    nm = solved.nm;
  }

  const points: GeoPoint[] = [origin, ...path, destination];
  const names = [origin.name, ...path.map((w) => w.name), destination.name];
  const legs: RouteLeg[] = points.slice(0, -1).map((from, i) => ({
    from: names[i],
    to: names[i + 1],
    nm: Math.round(distanceNm(from, points[i + 1])),
    waypoint: path[i],
  }));

  const chokepoints = path.filter((w) => w.kind !== 'OPEN_WATER');
  const canalHours = path.reduce((sum, w) => sum + (CANAL_HOURS[w.id] ?? 0), 0);
  const seaDays = nm / (speed * 24);
  const totalDays = seaDays + canalHours / 24 + portDays;

  return {
    origin,
    destination,
    originBasin,
    destinationBasin,
    distanceNm: Math.round(nm),
    distanceKm: Math.round(nmToKm(nm)),
    legs,
    path,
    chokepoints,
    transit: {
      serviceSpeedKnots: speed,
      seaDays: Number(seaDays.toFixed(1)),
      canalHours,
      portDays,
      totalDays: Math.round(totalDays),
    },
    direct,
  };
}

export interface RouteComparison {
  primary: SeaRoutePlan;
  /** Best corridor that avoids the canal the primary uses — the diversion case. */
  alternative?: { plan: SeaRoutePlan; avoided: Waypoint };
}

/**
 * The best corridor plus, when the best one transits a canal, the best routing
 * without it. Suez and Panama both close or throttle in practice, and the delta
 * between the two is the number a planner actually needs.
 */
export function compareSeaRoutes(origin: RoutablePort, destination: RoutablePort, options: RouteOptions = {}): RouteComparison | null {
  const primary = planSeaRoute(origin, destination, options);
  if (!primary) return null;

  const canal = primary.path.find((w) => w.kind === 'CANAL');
  if (!canal) return { primary };

  const plan = planSeaRoute(origin, destination, { ...options, avoid: [...(options.avoid ?? []), canal.id] });
  return plan ? { primary, alternative: { plan, avoided: canal } } : { primary };
}

// -- Door to door: inland legs either side of the sea passage ------------------

export interface InlandLeg {
  from: RoutablePort;
  to: RoutablePort;
  mode: InlandMode;
  /** Route distance, i.e. the great circle scaled by the mode's detour factor. */
  distanceKm: number;
  days: number;
  note: string;
}

export interface DoorToDoorPlan {
  /** Land leg from an inland origin to its gateway seaport, when there is one. */
  originLeg?: InlandLeg;
  sea: SeaRoutePlan;
  /** Land leg from the discharge port to an inland destination, when there is one. */
  destinationLeg?: InlandLeg;
  totalDistanceKm: number;
  totalDays: number;
}

/** Resolve a registry port by code — supplied by the caller, which owns the registry. */
export type PortLookup = (code: string) => RoutablePort | undefined;

function inlandLeg(from: RoutablePort, to: RoutablePort, gateway: InlandGateway): InlandLeg {
  const straightKm = nmToKm(distanceNm(from, to));
  const distanceKm = Math.round(straightKm * INLAND_DETOUR[gateway.mode]);
  return {
    from,
    to,
    mode: gateway.mode,
    distanceKm,
    // A single day is the floor: even a short drayage move costs a working day.
    days: Math.max(1, Math.round(distanceKm / INLAND_KM_PER_DAY[gateway.mode])),
    note: gateway.note,
  };
}

/**
 * Pick the gateway seaport that yields the shortest total corridor, not the nearest
 * one. Delhi to Rotterdam should leave through Mundra rather than Nhava Sheva when
 * the sea leg makes up the difference.
 */
function bestGateway(
  inland: RoutablePort,
  gateway: InlandGateway,
  lookup: PortLookup,
  score: (seaport: RoutablePort) => number | null,
): { seaport: RoutablePort; leg: InlandLeg } | null {
  let best: { seaport: RoutablePort; leg: InlandLeg; total: number } | null = null;

  for (const code of gateway.gateways) {
    const seaport = lookup(code);
    if (!seaport) continue;
    const seaScore = score(seaport);
    if (seaScore == null) continue;
    const leg = inlandLeg(inland, seaport, gateway);
    const total = seaScore + leg.distanceKm;
    if (!best || total < best.total) best = { seaport, leg, total };
  }

  return best ? { seaport: best.seaport, leg: best.leg } : null;
}

/**
 * Plan a corridor that may start or end inland. A seaport at both ends is just the
 * ocean corridor; a dry port, ICD or rail terminal at either end adds the land leg
 * that actually gets the box to the water.
 *
 * Returns null when an end is neither a seaport nor an inland terminal with a known
 * gateway, or when no sea corridor connects the two gateways.
 */
export function planDoorToDoor(
  origin: RoutablePort,
  destination: RoutablePort,
  lookup: PortLookup,
  options: RouteOptions = {},
): DoorToDoorPlan | null {
  const originGateway = basinForPort(origin) ? null : inlandGatewayFor(origin.code);
  const destinationGateway = basinForPort(destination) ? null : inlandGatewayFor(destination.code);

  // An inland end with no known gateway corridor cannot be routed at all — better a
  // clear refusal than a leg invented over whatever land lies in between.
  if (!basinForPort(origin) && !originGateway) return null;
  if (!basinForPort(destination) && !destinationGateway) return null;

  // Resolve the sea end of each side, choosing gateways on total corridor cost.
  let loadPort = origin;
  let dischargePort = destination;
  let originLeg: InlandLeg | undefined;
  let destinationLeg: InlandLeg | undefined;

  if (destinationGateway) {
    const anchor = originGateway ? (lookup(originGateway.gateways[0]) ?? origin) : origin;
    const chosen = bestGateway(destination, destinationGateway, lookup, (seaport) => {
      const plan = planSeaRoute(anchor, seaport, options);
      return plan ? plan.distanceKm : null;
    });
    if (!chosen) return null;
    dischargePort = chosen.seaport;
    destinationLeg = { ...chosen.leg, from: chosen.seaport, to: destination };
  }

  if (originGateway) {
    const chosen = bestGateway(origin, originGateway, lookup, (seaport) => {
      const plan = planSeaRoute(seaport, dischargePort, options);
      return plan ? plan.distanceKm : null;
    });
    if (!chosen) return null;
    loadPort = chosen.seaport;
    originLeg = chosen.leg;
    // The discharge gateway was chosen against a provisional load port; now that the
    // real one is known, settle the other side against it.
    if (destinationGateway) {
      const settled = bestGateway(destination, destinationGateway, lookup, (seaport) => {
        const plan = planSeaRoute(loadPort, seaport, options);
        return plan ? plan.distanceKm : null;
      });
      if (settled) {
        dischargePort = settled.seaport;
        destinationLeg = { ...settled.leg, from: settled.seaport, to: destination };
      }
    }
  }

  const sea = planSeaRoute(loadPort, dischargePort, options);
  if (!sea) return null;

  return {
    originLeg,
    sea,
    destinationLeg,
    totalDistanceKm: sea.distanceKm + (originLeg?.distanceKm ?? 0) + (destinationLeg?.distanceKm ?? 0),
    totalDays: sea.transit.totalDays + (originLeg?.days ?? 0) + (destinationLeg?.days ?? 0),
  };
}

// -- Transhipment ------------------------------------------------------------

export interface CorridorHub {
  hub: RoutablePort;
  inbound: SeaRoutePlan;
  outbound: SeaRoutePlan;
  distanceNm: number;
  /** How much longer than sailing direct, as a percentage of the direct corridor. */
  detourPercent: number;
}

/**
 * Transhipment hubs that lie on, or close to, this corridor.
 *
 * Most long lanes are not sailed end to end by one ship: the box rides a trunk
 * service to a hub and a feeder onward. A hub costing ~0% extra distance is one the
 * corridor already passes — exactly where a relay would happen. This is geometry
 * over the hub list, NOT a published service: it says where to go looking for a real
 * sailing, and the caller must confirm one exists before promising it.
 */
export function hubsOnCorridor(
  origin: RoutablePort,
  destination: RoutablePort,
  lookup: PortLookup,
  options: RouteOptions & { maxDetourPercent?: number; limit?: number } = {},
): CorridorHub[] {
  const direct = planSeaRoute(origin, destination, options);
  if (!direct) return [];

  const maxDetour = options.maxDetourPercent ?? 25;
  const limit = options.limit ?? 3;

  return TRANSHIPMENT_HUBS.map((code) => lookup(code))
    .filter((hub): hub is RoutablePort => Boolean(hub) && hub!.code !== origin.code && hub!.code !== destination.code)
    .map((hub) => {
      const inbound = planSeaRoute(origin, hub, options);
      const outbound = planSeaRoute(hub, destination, options);
      if (!inbound || !outbound) return null;
      const distanceNm = inbound.distanceNm + outbound.distanceNm;
      return {
        hub,
        inbound,
        outbound,
        distanceNm,
        detourPercent: Number((((distanceNm - direct.distanceNm) / direct.distanceNm) * 100).toFixed(1)),
      };
    })
    .filter((routing): routing is CorridorHub => routing !== null && routing.detourPercent <= maxDetour)
    .sort((a, b) => a.detourPercent - b.detourPercent)
    .slice(0, limit);
}
