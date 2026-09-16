/**
 * @file lib/shipping-directory/api.ts
 * @description Server-side reader for the World Shipping Directory.
 *
 * Talks to trade-service's public reference endpoints (`/v1/public/shipping/*`), which
 * own the `tradeops` schema. The directory does NOT read that schema through this app's
 * Prisma client: each bounded context owns its tables, and reaching across would make
 * this app a second writer's-eye view of someone else's data.
 *
 * Server-only. Every page under /shipping-directory is a Server Component, so directory
 * data never round-trips through the browser and needs no public API surface here.
 */
import 'server-only';

const BASE = process.env.SHIPPING_DIRECTORY_API_URL
  || process.env.NEXT_PUBLIC_API_BASE_URL
  || 'http://localhost:3025';

/** Reference data changes on an ingest run, not per request. */
const REVALIDATE_SECONDS = 300;

/** Attribution for a photograph. Absent where the ingest could not establish one, in
 *  which case the photograph is not published either — see media.tsx. */
export interface ImageCredit {
  author: string | null;
  licence: string | null;
  licenceUrl: string | null;
  descriptionUrl: string | null;
  usable?: boolean;
}

export interface DirectoryPerson {
  qid: string | null;
  name: string;
  role: string | null;
  description: string | null;
  image: string | null;
  imageCredit: ImageCredit | null;
  bornYear: number | null;
  diedYear: number | null;
}

export interface DirectoryOrg {
  qid: string | null;
  name: string;
  description: string | null;
}

export interface Company {
  id: string;
  slug: string;
  code: string;
  name: string;
  legal_name: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  country: string | null;
  country_code: string | null;
  headquarters: string | null;
  founded_year: number | null;
  company_type: string | null;
  employee_count: number | null;
  parent_name: string | null;
  alliance: string | null;
  registry_vessel_count: number;
  registry_gt: string | number | null;
  registry_teu: string | number | null;
  reported_fleet_size: number | null;
  reported_teu: string | number | null;
  market_share_pct: string | number | null;
  capacity_rank: number | null;
  reported_source: string | null;
  reported_source_url: string | null;
  reported_as_of: string | null;
  data_source: string | null;
  source_url: string | null;
  wikidata_qid: string | null;
  last_ingested_at: string | null;

  // ── depth (migration 069). Present on the company profile; the list endpoint
  // returns only the handful of these it can actually render.
  founders?: DirectoryPerson[];
  key_people?: DirectoryPerson[];
  subsidiaries?: DirectoryOrg[];
  owners?: DirectoryOrg[];
  products?: DirectoryOrg[];
  industry?: string | null;
  legal_form?: string | null;
  formed_in?: string | null;
  stock_exchange?: string | null;
  ticker?: string | null;
  isin?: string | null;
  lei?: string | null;
  dissolved_year?: number | null;
  revenue?: string | number | null;
  net_profit?: string | number | null;
  operating_income?: string | number | null;
  total_assets?: string | number | null;
  total_equity?: string | number | null;
  market_cap?: string | number | null;
  financials_currency?: string | null;
  financials_as_of?: number | null;
  hq_lat?: string | number | null;
  hq_lon?: string | number | null;
  image_url?: string | null;
  image_credit?: ImageCredit | null;
  logo_credit?: ImageCredit | null;
  wikipedia_title?: string | null;
  wikipedia_url?: string | null;
  summary?: string | null;
  social?: Record<string, string | null>;
  has_summary?: boolean;
  // Precomputed peer position (migration 071).
  fleet_rank_global?: number | null;
  fleet_rank_in_country?: number | null;
  country_carrier_count?: number | null;
  /**
   * Whether this record carries enough of its own substance to be worth submitting for
   * indexing. Computed server-side so the page's robots meta and the sitemap can never
   * disagree — see VESSEL_INDEXABLE_SQL / CARRIER_INDEXABLE_SQL.
   */
  is_indexable?: boolean;
}

export interface Vessel {
  slug: string;
  name: string;
  imo_number: string | null;
  mmsi?: string | null;
  vessel_type: string;
  vessel_class?: string | null;
  flag_country: string | null;
  gross_tonnage: number | null;
  year_built: number | null;
  length_m: string | number | null;
  beam_m?: string | number | null;
  draft_m?: string | number | null;
  builder_name?: string | null;
  home_port?: string | null;
  call_sign?: string | null;
  image_url: string | null;
  image_credit?: ImageCredit | null;
  capacity_teu?: string | number | null;
  deadweight_tons?: string | number | null;
  net_tonnage?: number | null;
  displacement_t?: string | number | null;
  yard_number?: string | null;
  launched_year?: number | null;
  designed_to_carry?: string | null;
  service_speed_knots?: string | number | null;
  passenger_capacity?: number | null;
  lane_metres?: string | number | null;
  cubic_metres?: string | number | null;
  /** The raw capacity statement, present only where the source named its unit. */
  capacity_value?: string | number | null;
  capacity_unit?: string | null;
  events?: { event: string; year: number | null; qid?: string }[];
  metadata?: Record<string, unknown>;
  carrier_capacity_rank?: number | null;
  /** Hub slugs, resolved server-side from the cohort table — never re-derived here. */
  builder_slug?: string | null;
  flag_slug?: string | null;
  is_indexable?: boolean;
  // Precomputed cohort position (migration 071). Null where no tonnage is recorded.
  gt_rank_global?: number | null;
  gt_rank_in_type?: number | null;
  gt_rank_in_flag?: number | null;
  gt_rank_in_year?: number | null;
  gt_pct_in_type?: string | number | null;
  wikipedia_title?: string | null;
  wikipedia_url?: string | null;
  summary?: string | null;
  status?: string | null;
  operator_name?: string | null;
  owner_name?: string | null;
  source_url?: string | null;
  carrier_slug?: string | null;
  carrier_name?: string | null;
}

/** A precomputed cohort the vessel pages compare against. See build-context.js. */
export interface CohortStats {
  dimension: string;
  cohort_key: string;
  n: number;
  with_gt: number;
  median_gt: string | number | null;
  p10_gt: string | number | null;
  p90_gt: string | number | null;
  max_gt: string | number | null;
  median_year: number | null;
  oldest_year: number | null;
  newest_year: number | null;
  median_length: string | number | null;
  top_flag: string | null;
  top_flag_n: number | null;
  top_type: string | null;
  top_type_n: number | null;
  top_builder: string | null;
  top_builder_n: number | null;
}

export interface VesselContext {
  cohorts: Partial<Record<'global' | 'type' | 'flag' | 'year' | 'builder' | 'decade', CohortStats>>;
  neighbours: { larger: Vessel[]; smaller: Vessel[] };
  /** Hulls sharing BOTH this ship's flag and its type — narrower than either alone. */
  crossFlagType: { n: number; larger: number } | null;
  /**
   * What else sits near this hull in the IMO series. For the 1,800 vessels holding a name
   * and an IMO number and nothing else, this is the only per-record thing that can be
   * said — and it is a count over real rows, not an inference about this ship.
   */
  imoSeries: {
    window: number; n: number; with_year: number;
    median_year: number | null; oldest: number | null; newest: number | null;
    adjacent: Vessel[];
  } | null;
}

export interface FleetHistoryRow {
  year: number;
  basis: string;
  vessels_delivered: number;
  cumulative_vessels: number;
  teu_delivered: string | number | null;
  cumulative_teu: string | number | null;
  gt_delivered: string | number | null;
}

export interface CarrierContext {
  registry: { n: number; with_fleet: number; median_fleet: number | null; median_founded: number | null; oldest_founded: number | null } | null;
  country: { n: number; fleet: number | null; median_founded: number | null; ranked: number } | null;
  sameEra: { n: number; median_fleet: number | null } | null;
}

export interface CompanyProfile {
  company: Company;
  context: CarrierContext | null;
  /**
   * Related entities (subsidiary / owner) that this directory holds a page for, keyed by
   * Wikidata QID. Most related entities are ports or holding companies with no page; the
   * ones here are carriers and get linked.
   */
  related: Record<string, {
    wikidata_qid: string;
    slug: string;
    name: string;
    capacity_rank: number | null;
    registry_vessel_count: number;
    reported_fleet_size: number | null;
  }>;
  /** Other operators registered in the same country. */
  peers: Pick<Company, 'slug' | 'name' | 'country' | 'registry_vessel_count' | 'reported_fleet_size' | 'capacity_rank' | 'founded_year' | 'logo_url'>[];
  registry: {
    summary: {
      vessels: number;
      with_year: number;
      with_tonnage: number;
      total_gt: string | number | null;
      avg_gt: number | null;
      max_gt: number | null;
      oldest_year: number | null;
      newest_year: number | null;
      avg_age_years: string | number | null;
      flag_states: number;
      vessel_types: number;
    } | null;
    byType: { vessel_type: string; n: number; gt: string | number | null }[];
    byFlag: { flag_country: string; n: number }[];
    byDecade: { decade: number; n: number }[];
    builders: { builder_name: string; n: number }[];
    largest: Vessel[];
    newest: Vessel[];
    history: FleetHistoryRow[];
    basis: string;
    note: string;
  };
  reported: {
    fleetSize: number;
    teu: string | number | null;
    marketSharePct: string | number | null;
    rank: number | null;
    source: string | null;
    sourceUrl: string | null;
    asOf: string | null;
    basis: string;
  } | null;
}

export interface DirectoryStats {
  totals: {
    companies: number;
    commercial_companies: number;
    companies_with_fleet: number;
    companies_with_reported_fleet: number;
    state_fleets: number;
    companies_with_summary: number;
    companies_with_founder: number;
    vessels_with_photo: number;
    vessels: number;
    vessels_with_operator: number;
    vessels_with_imo: number;
    flag_states: number;
    company_countries: number;
    total_gross_tonnage: string | number | null;
    last_ingested_at: string | null;
  };
  byType: { vessel_type: string; n: number }[];
  byFlag: { flag_country: string; n: number }[];
  byDecade: { decade: number; n: number }[];
  topCountries: { country: string; country_code: string | null; n: number }[];
  topBuilders: { builder_name: string; n: number; gt: string | number | null }[];
}

export interface CountryProfile {
  summary: {
    country: string;
    country_code: string;
    companies: number;
    ranked_companies: number;
    registry_vessels: number;
    reported_vessels: number | null;
    reported_teu: string | number | null;
    oldest_founded: number | null;
  };
  companies: (Pick<Company, 'slug' | 'name' | 'headquarters' | 'founded_year' | 'registry_vessel_count' | 'reported_fleet_size' | 'reported_teu' | 'capacity_rank' | 'logo_url'> & { industry: string | null })[];
  fleetByType: { vessel_type: string; n: number }[];
  topShips: (Vessel & { carrier_slug: string | null; carrier_name: string | null })[];
}

export interface CohortListRow {
  slug: string;
  cohort_key: string;
  n: number;
  with_gt: number;
  median_gt: string | number | null;
  max_gt: string | number | null;
  oldest_year: number | null;
  newest_year: number | null;
  top_type: string | null;
  top_type_n: number | null;
}

export interface CohortHub {
  /** `flag` and `vesselType` are present only on the flag x type cross-cut. */
  cohort: CohortStats & { slug: string; flag?: string; vesselType?: string };
  rank: { rank: number; peers: number } | null;
  vessels: Paged<Vessel>;
  /** For the cross-cut this is the builder breakdown, with the hub slug to link to. */
  byType: { vessel_type: string; n: number; slug?: string | null }[];
  topOperators: { slug: string; name: string; n: number }[];
}

export interface Paged<T> { data: T[]; total: number; limit: number; offset: number; scope?: string }

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T | null> {
  const url = new URL(`${BASE}/v1/public/shipping${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== null) url.searchParams.set(k, String(v));
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const body = await res.json();
    // trade-service wraps successful payloads as { success, data }.
    return (body?.data ?? body) as T;
  } catch {
    // An unreachable registry renders an explicit empty state; it never invents rows.
    return null;
  }
}

export const getStats = () => get<DirectoryStats>('/stats');
export const getRankings = () =>
  get<{ data: Company[]; provenance: { source: string; sourceUrl: string; asOf: string } | null }>('/rankings');
export const getCountries = () =>
  get<{ country: string; country_code: string | null; companies: number; registry_vessels: number }[]>('/countries');
export const getCountry = (code: string) =>
  get<CountryProfile>(`/countries/${encodeURIComponent(code)}`);
/** Slug + lastmod for the sitemap. Paged: the vessel table is past the 50,000-URL ceiling. */
/** A shipbuilder or flag-state hub. `dimension` is a fixed path segment, not user input. */
export const getCohort = (
  dimension: 'builder' | 'flag' | 'flag_type',
  slug: string,
  p: Record<string, string | number | undefined> = {},
) => get<CohortHub>(
  // The cross-cut slug is two path segments (<flag>/<type>) and must not be escaped into one.
  dimension === 'flag_type'
    ? `/cohorts/flag_type/${slug.split('/').map(encodeURIComponent).join('/')}`
    : `/cohorts/${dimension}/${encodeURIComponent(slug)}`,
  p,
);

export const listCohorts = (dimension: 'builder' | 'flag' | 'flag_type') =>
  get<CohortListRow[]>(`/cohorts/${dimension}`);

export const getSitemapEntries = (kind: 'companies' | 'vessels', p: { limit?: number; offset?: number } = {}) =>
  get<{ data: { slug: string; lastmod: string | null }[]; total: number; limit: number; offset: number }>(`/sitemap/${kind}`, p);

export const listCompanies = (p: Record<string, string | number | undefined>) => get<Paged<Company>>('/companies', p);
export const getCompany = (slug: string) => get<CompanyProfile>(`/companies/${encodeURIComponent(slug)}`);
export const listCompanyVessels = (slug: string, p: Record<string, string | number | undefined>) =>
  get<Paged<Vessel>>(`/companies/${encodeURIComponent(slug)}/vessels`, p);

export const listVessels = (p: Record<string, string | number | undefined>) => get<Paged<Vessel>>('/vessels', p);
export const getVessel = (slug: string) =>
  get<{
    vessel: Vessel & { carrier_slug: string | null; carrier_name: string | null; carrier_country: string | null; carrier_capacity_rank: number | null; metadata?: Record<string, unknown> };
    ranks: {
      gt_rank_global: number; gt_ranked_total: number;
      gt_rank_in_type: number; type_ranked_total: number;
      gt_rank_in_fleet: number; fleet_ranked_total: number;
    } | null;
    sisters: Vessel[];
    /** Same builder, same years. Contemporaries — NOT asserted to be sister ships. */
    yardMates: Vessel[];
    fleetMates: Vessel[];
    /** Precomputed cohort position + nearest hulls by tonnage. See build-context.js. */
    context: VesselContext;
  }>(`/vessels/${encodeURIComponent(slug)}`);

// ── formatting helpers (shared by every directory page) ────────────────────────

export const VESSEL_TYPE_LABELS: Record<string, string> = {
  container: 'Container ship',
  bulk_carrier: 'Bulk carrier',
  tanker: 'Tanker',
  oil_tanker: 'Oil tanker',
  chemical_tanker: 'Chemical / products tanker',
  lng_carrier: 'LNG carrier',
  lpg_carrier: 'LPG carrier',
  roro: 'Ro-Ro',
  car_carrier: 'Car carrier',
  general_cargo: 'General cargo',
  multi_purpose: 'Multi-purpose',
  reefer: 'Reefer',
  cruise: 'Cruise ship',
  ferry: 'Ferry',
  passenger: 'Passenger vessel',
  tug: 'Tug',
  offshore_supply: 'Offshore supply',
  fishing: 'Fishing vessel',
  research: 'Research / survey',
  dredger: 'Dredger',
  heavy_lift: 'Heavy lift',
  barge: 'Barge',
  naval: 'Naval / patrol',
  rig: 'Rig / offshore unit',
  yacht: 'Yacht',
  other: 'Unclassified',
};

export const typeLabel = (t: string) => VESSEL_TYPE_LABELS[t] ?? t;

const nf = new Intl.NumberFormat('en-US');
export function num(v: string | number | null | undefined): string | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? nf.format(Math.round(n as number)) : null;
}
/**
 * Percentages arrive as Postgres numeric(6,3) strings — "21.600" — so a naive render
 * shows spurious precision the source never claimed. Trim trailing zeros instead.
 */
export function pct(v: string | number | null | undefined): string | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return null;
  return `${Number((n as number).toFixed(3))}%`;
}

/**
 * A money figure with its currency, compacted at the scale the number actually warrants.
 *
 * Returns null unless BOTH the amount and the currency are known: "55,000,000,000" with
 * no unit is not a fact, and guessing USD because most of the set is USD would be
 * inventing one. The year is rendered by the caller, next to the label, because a
 * financial figure without its period is the specific error migration 069 exists to stop.
 */
export function money(v: string | number | null | undefined, currency?: string | null): string | null {
  if (v === null || v === undefined || v === '' || !currency) return null;
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return null;
  const abs = Math.abs(n);
  const [scaled, unit] = abs >= 1e12 ? [n / 1e12, 'tn']
    : abs >= 1e9 ? [n / 1e9, 'bn']
      : abs >= 1e6 ? [n / 1e6, 'm']
        : [n, ''];
  const digits = unit && Math.abs(scaled) < 100 ? 1 : 0;
  const body = scaled.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${body}${unit} ${currency}`;
}

export function dec(v: string | number | null | undefined, places = 1): string | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? (n as number).toFixed(places) : null;
}
