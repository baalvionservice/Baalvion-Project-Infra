/**
 * @file server/gckb/public-read.ts
 * @description The public, read-only projection of the Global Country Knowledge
 * Base — the data source for the unauthenticated public portal (Country Explorer,
 * Country Profile, Tariff / FTA / Port / Authority directories) and the
 * `/api/gckb/public/*` JSON endpoints.
 *
 * Two invariants make this safe to expose without a principal:
 *   1. **Global baseline only** — reads pass `organizationId: null`, so the public
 *      never sees any tenant's private overrides, only the canonical baseline.
 *   2. **Published only** — every query filters `status === 'PUBLISHED'`, so drafts,
 *      superseded and archived records are invisible to the public.
 *
 * This module is server-only (it imports Prisma-backed repositories) and is
 * therefore only ever imported by Server Components and route handlers.
 */
import { GckbRecord } from '@prisma/client';
import { gckbRecordRepository } from '../repositories';
import { RecordSearchFilter } from '../repositories/gckb-repository';
import { getPolicyGroup, PolicyGroup } from './policy-forms';
import { getPolicyType } from './policy-types';

const PUBLISHED = 'PUBLISHED';
const PAGE = 200;

type Attrs = Record<string, unknown>;

function attrs(record: GckbRecord): Attrs {
  return (record.attributes as Attrs | null) ?? {};
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

/** Page through the published global baseline for an entity type / filter. */
async function fetchAllPublished(filter: RecordSearchFilter): Promise<GckbRecord[]> {
  const all: GckbRecord[] = [];
  let page = 1;
  // Hard cap of 50 pages (10k rows) — a defensive bound, never reached in practice.
  for (; page <= 50; page += 1) {
    const result = await gckbRecordRepository.search(null, { ...filter, status: PUBLISHED }, { page, pageSize: PAGE });
    all.push(...result.items);
    if (page >= result.pages || result.items.length === 0) break;
  }
  return all;
}

// ── View shapes (lean, serialisable, no internal columns leaked) ─────────────

export interface CountrySummary {
  code: string; // ISO alpha-2 (the natural key)
  name: string;
  officialName?: string;
  alpha3?: string;
  region?: string;
  subregion?: string;
  capital?: string;
  flagEmoji?: string;
  currencyCodes: string[];
}

export interface CountryDetail extends CountrySummary {
  numericCode?: string;
  languageCodes: string[];
  timezoneCodes: string[];
  dialingCode?: string;
  updatedAt: string;
}

export interface PolicyView {
  id: string;
  recordKey: string;
  name: string;
  policyType: string;
  policyTypeLabel: string;
  group: PolicyGroup;
  code: string | null;
  hsCode: string | null;
  productCategory: string | null;
  authority: string | null;
  attributes: Attrs;
  tags: string[];
  effectiveFrom: string | null;
  effectiveTo: string | null;
  version: number;
  updatedAt: string;
}

export interface AuthorityView {
  id: string;
  recordKey: string;
  name: string;
  kind?: string;
  code: string | null;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  jurisdiction?: string;
}

export interface PortView {
  id: string;
  recordKey: string;
  name: string;
  kind?: string;
  code: string | null;
  unlocode?: string;
  iata?: string;
  icao?: string;
  latitude?: number;
  longitude?: number;
  capacityNote?: string;
}

export interface AgreementView {
  id: string;
  recordKey: string;
  name: string;
  kind?: string;
  status?: string;
  inForceSince?: string;
  memberCountryCodes: string[];
  rulesOfOriginSummary?: string;
  dutyPreferenceNote?: string;
}

export interface CountryProfile {
  country: CountryDetail;
  policies: PolicyView[];
  policyGroups: Partial<Record<PolicyGroup, PolicyView[]>>;
  authorities: AuthorityView[];
  ports: PortView[];
  agreements: AgreementView[];
  counts: { policies: number; authorities: number; ports: number; agreements: number };
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function toCountrySummary(record: GckbRecord): CountrySummary {
  const a = attrs(record);
  return {
    code: record.recordKey,
    name: record.name,
    officialName: str(a.officialName),
    alpha3: str(a.alpha3),
    region: str(a.region),
    subregion: str(a.subregion),
    capital: str(a.capital),
    flagEmoji: str(a.flagEmoji),
    currencyCodes: strArray(a.currencyCodes),
  };
}

function toCountryDetail(record: GckbRecord): CountryDetail {
  const a = attrs(record);
  return {
    ...toCountrySummary(record),
    numericCode: str(a.numericCode),
    languageCodes: strArray(a.languageCodes),
    timezoneCodes: strArray(a.timezoneCodes),
    dialingCode: str(a.dialingCode),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toPolicyView(record: GckbRecord): PolicyView {
  const policyType = record.policyType ?? 'unknown';
  return {
    id: record.id,
    recordKey: record.recordKey,
    name: record.name,
    policyType,
    policyTypeLabel: getPolicyType(policyType)?.label ?? policyType,
    group: getPolicyGroup(policyType),
    code: record.code,
    hsCode: record.hsCode,
    productCategory: record.productCategory,
    authority: record.authority,
    attributes: attrs(record),
    tags: record.tags ?? [],
    effectiveFrom: iso(record.effectiveFrom),
    effectiveTo: iso(record.effectiveTo),
    version: record.version,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toAuthorityView(record: GckbRecord): AuthorityView {
  const a = attrs(record);
  return {
    id: record.id,
    recordKey: record.recordKey,
    name: record.name,
    kind: str(a.kind),
    code: record.code,
    website: str(a.website),
    email: str(a.email),
    phone: str(a.phone),
    address: str(a.address),
    jurisdiction: str(a.jurisdiction),
  };
}

function toPortView(record: GckbRecord): PortView {
  const a = attrs(record);
  return {
    id: record.id,
    recordKey: record.recordKey,
    name: record.name,
    kind: str(a.kind),
    code: record.code,
    unlocode: str(a.unlocode),
    iata: str(a.iata),
    icao: str(a.icao),
    latitude: num(a.latitude),
    longitude: num(a.longitude),
    capacityNote: str(a.capacityNote),
  };
}

function toAgreementView(record: GckbRecord): AgreementView {
  const a = attrs(record);
  return {
    id: record.id,
    recordKey: record.recordKey,
    name: record.name,
    kind: str(a.kind),
    status: str(a.status),
    inForceSince: str(a.inForceSince),
    memberCountryCodes: strArray(a.memberCountryCodes).map((c) => c.toUpperCase()),
    rulesOfOriginSummary: str(a.rulesOfOriginSummary),
    dutyPreferenceNote: str(a.dutyPreferenceNote),
  };
}

// ── Public queries ───────────────────────────────────────────────────────────

/** All published countries, sorted by name. */
export async function listCountries(): Promise<CountrySummary[]> {
  const records = await fetchAllPublished({ entityType: 'country' });
  return records.map(toCountrySummary).sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a single published country head row by ISO code, or null. */
async function publishedCountryRecord(code: string): Promise<GckbRecord | null> {
  const id = await gckbRecordRepository.findCountryIdByCode(code, null);
  if (!id) return null;
  const record = await gckbRecordRepository.findById(id);
  return record && record.status === PUBLISHED ? record : null;
}

/** Lightweight existence/detail lookup for a country (no aggregation). */
export async function getCountryDetail(code: string): Promise<CountryDetail | null> {
  const record = await publishedCountryRecord(code);
  return record ? toCountryDetail(record) : null;
}

/**
 * The full public country profile: the country plus every published policy
 * (grouped), the authorities and ports scoped to it, and the trade agreements it
 * is a party to. Returns null when the country is absent / unpublished.
 */
export async function getCountryProfile(code: string): Promise<CountryProfile | null> {
  const countryRecord = await publishedCountryRecord(code);
  if (!countryRecord) return null;
  const countryId = countryRecord.id;
  const detail = toCountryDetail(countryRecord);

  const [policyRecords, authorityRecords, portRecords, agreementRecords] = await Promise.all([
    fetchAllPublished({ entityType: 'country_policy', countryId }),
    fetchAllPublished({ entityType: 'authority', countryId }),
    fetchAllPublished({ entityType: 'point_of_entry', countryId }),
    fetchAllPublished({ entityType: 'trade_agreement' }),
  ]);

  const policies = policyRecords.map(toPolicyView);
  const policyGroups: Partial<Record<PolicyGroup, PolicyView[]>> = {};
  for (const p of policies) {
    (policyGroups[p.group] ??= []).push(p);
  }

  const memberCodes = new Set([detail.code, detail.alpha3].filter(Boolean).map((c) => String(c).toUpperCase()));
  const agreements = agreementRecords
    .map(toAgreementView)
    .filter((agr) => agr.memberCountryCodes.some((m) => memberCodes.has(m)))
    .sort((a, b) => a.name.localeCompare(b.name));

  const authorities = authorityRecords.map(toAuthorityView).sort((a, b) => a.name.localeCompare(b.name));
  const ports = portRecords.map(toPortView).sort((a, b) => a.name.localeCompare(b.name));

  return {
    country: detail,
    policies,
    policyGroups,
    authorities,
    ports,
    agreements,
    counts: {
      policies: policies.length,
      authorities: authorities.length,
      ports: ports.length,
      agreements: agreements.length,
    },
  };
}

/** Generic published search for the explorers (tariff/port/authority/fta slices). */
export async function searchPublished(
  filter: RecordSearchFilter,
): Promise<GckbRecord[]> {
  return fetchAllPublished(filter);
}

// ── Trade agreements (FTA Explorer + Rules of Origin) ────────────────────────

export interface AgreementPreferentialTariff {
  countryCode: string;
  countryName: string;
  recordKey: string;
  name: string;
  hsCode: string | null;
  ratePercent: number | null;
}

export interface AgreementDetail {
  agreement: AgreementView;
  members: CountrySummary[];
  preferentialTariffs: AgreementPreferentialTariff[];
}

/** All published trade agreements / FTAs, sorted by name. */
export async function listAgreements(): Promise<AgreementView[]> {
  const records = await fetchAllPublished({ entityType: 'trade_agreement' });
  return records.map(toAgreementView).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * A trade agreement plus its resolved member countries and every published
 * preferential tariff line that grants preference under it (the operative
 * "rules of origin → duty preference" view). Returns null if absent/unpublished.
 */
export async function getAgreementDetail(code: string): Promise<AgreementDetail | null> {
  const key = code.toUpperCase();
  const agreementRecords = await fetchAllPublished({ entityType: 'trade_agreement' });
  const match = agreementRecords.find((r) => r.recordKey.toUpperCase() === key);
  if (!match) return null;
  const agreement = toAgreementView(match);

  const countryRecords = await fetchAllPublished({ entityType: 'country' });
  const byCode = new Map<string, GckbRecord>();
  const byId = new Map<string, GckbRecord>();
  for (const c of countryRecords) {
    byId.set(c.id, c);
    byCode.set(c.recordKey.toUpperCase(), c);
    const a3 = str(attrs(c).alpha3);
    if (a3) byCode.set(a3.toUpperCase(), c);
  }

  const members = agreement.memberCountryCodes
    .map((m) => byCode.get(m))
    .filter((c): c is GckbRecord => Boolean(c))
    .map(toCountrySummary);

  const tariffRecords = await fetchAllPublished({ entityType: 'country_policy', policyType: 'tariff' });
  const preferentialTariffs: AgreementPreferentialTariff[] = tariffRecords
    .filter((t) => (str(attrs(t).preferentialUnder) ?? '').toUpperCase() === key)
    .map((t) => {
      const country = t.countryId ? byId.get(t.countryId) : null;
      return {
        countryCode: country?.recordKey ?? '—',
        countryName: country?.name ?? '—',
        recordKey: t.recordKey,
        name: t.name,
        hsCode: t.hsCode,
        ratePercent: num(attrs(t).ratePercent) ?? null,
      };
    })
    .sort((a, b) => a.countryName.localeCompare(b.countryName));

  return { agreement, members, preferentialTariffs };
}

// ── Country comparison ───────────────────────────────────────────────────────

export interface CountryComparisonEntry {
  country: CountryDetail;
  groupCounts: Partial<Record<PolicyGroup, number>>;
  taxes: Array<{ name: string; taxType: string | null; ratePercent: number | null }>;
  agreements: number;
  authorities: number;
  ports: number;
  policies: number;
}

export interface CountryComparison {
  countries: CountryComparisonEntry[];
  missing: string[];
}

/** Side-by-side comparison of 2–4 countries' published trade posture. */
export async function compareCountries(codes: string[]): Promise<CountryComparison> {
  const unique = [...new Set(codes.map((c) => c.toUpperCase()))].slice(0, 4);
  const profiles = await Promise.all(unique.map((code) => getCountryProfile(code)));

  const countries: CountryComparisonEntry[] = [];
  const missing: string[] = [];
  unique.forEach((code, i) => {
    const profile = profiles[i];
    if (!profile) {
      missing.push(code);
      return;
    }
    const groupCounts: Partial<Record<PolicyGroup, number>> = {};
    for (const [group, list] of Object.entries(profile.policyGroups)) {
      groupCounts[group as PolicyGroup] = list?.length ?? 0;
    }
    const taxes = (profile.policyGroups.tax ?? []).map((p) => ({
      name: p.name,
      taxType: typeof p.attributes.taxType === 'string' ? (p.attributes.taxType as string) : null,
      ratePercent: typeof p.attributes.ratePercent === 'number' ? (p.attributes.ratePercent as number) : null,
    }));
    countries.push({
      country: profile.country,
      groupCounts,
      taxes,
      agreements: profile.counts.agreements,
      authorities: profile.counts.authorities,
      ports: profile.counts.ports,
      policies: profile.counts.policies,
    });
  });

  return { countries, missing };
}

// ── Cross-country directories (Ports + Authorities) ──────────────────────────

export interface DirectoryPort extends PortView {
  countryCode: string;
  countryName: string;
}

export interface DirectoryAuthority extends AuthorityView {
  countryCode: string;
  countryName: string;
}

/** Map of country id → { code, name } over the published global baseline. */
async function countryIndex(): Promise<Map<string, { code: string; name: string }>> {
  const countries = await fetchAllPublished({ entityType: 'country' });
  return new Map(countries.map((c) => [c.id, { code: c.recordKey, name: c.name }]));
}

/** Every published port / point of entry across all countries, country-tagged. */
export async function listPortsDirectory(): Promise<DirectoryPort[]> {
  const [records, index] = await Promise.all([fetchAllPublished({ entityType: 'point_of_entry' }), countryIndex()]);
  return records
    .map((r) => {
      const country = r.countryId ? index.get(r.countryId) : undefined;
      return { ...toPortView(r), countryCode: country?.code ?? '—', countryName: country?.name ?? '—' };
    })
    .sort((a, b) => a.countryName.localeCompare(b.countryName) || a.name.localeCompare(b.name));
}

/** Every published authority across all countries, country-tagged (supranational bodies show "—"). */
export async function listAuthoritiesDirectory(): Promise<DirectoryAuthority[]> {
  const [records, index] = await Promise.all([fetchAllPublished({ entityType: 'authority' }), countryIndex()]);
  return records
    .map((r) => {
      const country = r.countryId ? index.get(r.countryId) : undefined;
      return { ...toAuthorityView(r), countryCode: country?.code ?? '—', countryName: country?.name ?? 'Supranational' };
    })
    .sort((a, b) => a.countryName.localeCompare(b.countryName) || a.name.localeCompare(b.name));
}

export { toPolicyView, toAuthorityView, toPortView, toAgreementView, toCountrySummary, toCountryDetail };
