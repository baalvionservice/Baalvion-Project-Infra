/**
 * Groups the network's ISO country list (see countries.ts) into four broad
 * world regions for the /world jurisdiction directory. Purely a geographic
 * grouping for browsing — not a legal or political classification.
 */
import { COUNTRIES, type Country } from './countries';

export type RegionId = 'americas' | 'europe' | 'mea' | 'apac';

export interface Region {
  id: RegionId;
  name: string;
  countries: Country[];
}

const REGION_BY_CODE: Record<string, RegionId> = {
  // Americas
  AR: 'americas', BO: 'americas', BR: 'americas', CA: 'americas', CL: 'americas',
  CO: 'americas', CR: 'americas', DO: 'americas', EC: 'americas', SV: 'americas',
  GT: 'americas', HN: 'americas', JM: 'americas', MX: 'americas', PA: 'americas',
  PY: 'americas', PE: 'americas', US: 'americas', UY: 'americas', VE: 'americas',

  // Europe
  AL: 'europe', AT: 'europe', BE: 'europe', BA: 'europe', BG: 'europe', HR: 'europe',
  CY: 'europe', CZ: 'europe', DK: 'europe', EE: 'europe', FI: 'europe', FR: 'europe',
  DE: 'europe', GR: 'europe', HU: 'europe', IS: 'europe', IE: 'europe', IT: 'europe',
  LV: 'europe', LT: 'europe', LU: 'europe', MT: 'europe', NL: 'europe', NO: 'europe',
  PL: 'europe', PT: 'europe', RO: 'europe', RU: 'europe', RS: 'europe', SK: 'europe',
  SI: 'europe', ES: 'europe', SE: 'europe', CH: 'europe', UA: 'europe', GB: 'europe',

  // Middle East & Africa
  DZ: 'mea', BH: 'mea', CM: 'mea', CI: 'mea', EG: 'mea', ET: 'mea', GH: 'mea',
  IR: 'mea', IQ: 'mea', IL: 'mea', JO: 'mea', KE: 'mea', KW: 'mea', LB: 'mea',
  LY: 'mea', MA: 'mea', NG: 'mea', OM: 'mea', QA: 'mea', SA: 'mea', ZA: 'mea',
  TZ: 'mea', TN: 'mea', TR: 'mea', UG: 'mea', AE: 'mea', YE: 'mea', ZM: 'mea', ZW: 'mea',

  // Asia-Pacific
  AF: 'apac', AM: 'apac', AZ: 'apac', AU: 'apac', BD: 'apac', KH: 'apac', CN: 'apac',
  GE: 'apac', HK: 'apac', IN: 'apac', ID: 'apac', JP: 'apac', KZ: 'apac', MY: 'apac',
  NP: 'apac', NZ: 'apac', PK: 'apac', PH: 'apac', SG: 'apac', KR: 'apac', LK: 'apac',
  TW: 'apac', TH: 'apac', UZ: 'apac', VN: 'apac',
};

const REGION_NAMES: Record<RegionId, string> = {
  americas: 'Americas',
  europe: 'Europe',
  mea: 'Middle East & Africa',
  apac: 'Asia-Pacific',
};

const REGION_ORDER: RegionId[] = ['americas', 'europe', 'mea', 'apac'];

export function getRegions(): Region[] {
  const grouped = new Map<RegionId, Country[]>();
  for (const country of COUNTRIES) {
    const regionId = REGION_BY_CODE[country.code] ?? 'apac';
    const existing = grouped.get(regionId) ?? [];
    grouped.set(regionId, [...existing, country]);
  }
  return REGION_ORDER.map((id) => ({
    id,
    name: REGION_NAMES[id],
    countries: (grouped.get(id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}
