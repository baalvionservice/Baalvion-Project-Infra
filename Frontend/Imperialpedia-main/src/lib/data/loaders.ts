/**
 * @fileOverview Global Data Loading Engine for Imperialpedia knowledge entities.
 *
 * LIVE source: imperialpedia-service (`/entities`, schema `imperialpedia`). The four
 * encyclopedia entity types (country/company/industry/technology) are stored in one
 * generic table and managed from the admin platform. The static `@/data/*` JSON is kept
 * as a fallback so list/detail pages never break while the service is unreachable.
 *
 * These run server-side (RSC); imperialpedia-service is reachable on localhost without CORS.
 */

import countriesData from '@/data/countries/countries.json';
import companiesData from '@/data/companies/companies.json';
import industriesData from '@/data/industries/industries.json';
import technologiesData from '@/data/technologies/technologies.json';
import {
  CountryEntity,
  CompanyEntity,
  IndustryEntity,
  TechnologyEntity,
  EntityType,
  BaseEntity,
} from '@/types/entity';

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || 'http://localhost:3004/api/v1';

const STATIC: Record<string, unknown[]> = {
  country: countriesData as unknown[],
  company: companiesData as unknown[],
  industry: industriesData as unknown[],
  technology: technologiesData as unknown[],
};

// List a type from the service; fall back to bundled static data on empty/error.
async function fetchList<T>(type: string, fallback: unknown[]): Promise<T[]> {
  try {
    const res = await fetch(`${IMP_API}/entities?type=${type}&limit=500`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const items: unknown[] = json?.data?.items ?? [];
    return (items.length > 0 ? items : fallback) as T[];
  } catch {
    return fallback as T[];
  }
}

// Fetch one by slug; fall back to the static set on 404/error so legacy links resolve.
async function fetchOne<T>(type: string, slug: string, fallback: unknown[]): Promise<T | undefined> {
  try {
    const res = await fetch(`${IMP_API}/entities/${type}/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (res.ok) return ((await res.json())?.data ?? undefined) as T | undefined;
    if (res.status !== 404) throw new Error(String(res.status));
  } catch {
    /* fall through to static */
  }
  return (fallback as Array<{ slug: string }>).find((i) => i.slug === slug) as T | undefined;
}

// --- Typed Loaders ---

export async function loadCountries(): Promise<CountryEntity[]> {
  return fetchList<CountryEntity>('country', STATIC.country);
}

export async function loadCompanies(): Promise<CompanyEntity[]> {
  return fetchList<CompanyEntity>('company', STATIC.company);
}

export async function loadIndustries(): Promise<IndustryEntity[]> {
  return fetchList<IndustryEntity>('industry', STATIC.industry);
}

export async function loadTechnologies(): Promise<TechnologyEntity[]> {
  return fetchList<TechnologyEntity>('technology', STATIC.technology);
}

// --- Slug-based Retrieval ---

export async function getCountryBySlug(slug: string): Promise<CountryEntity | undefined> {
  return fetchOne<CountryEntity>('country', slug, STATIC.country);
}

export async function getCompanyBySlug(slug: string): Promise<CompanyEntity | undefined> {
  return fetchOne<CompanyEntity>('company', slug, STATIC.company);
}

export async function getIndustryBySlug(slug: string): Promise<IndustryEntity | undefined> {
  return fetchOne<IndustryEntity>('industry', slug, STATIC.industry);
}

export async function getTechnologyBySlug(slug: string): Promise<TechnologyEntity | undefined> {
  return fetchOne<TechnologyEntity>('technology', slug, STATIC.technology);
}

/**
 * Resolve an entity's cross-references (competitors / technologies / key_companies / etc.,
 * stored as slug arrays in the entity) into real entity objects for the Knowledge Graph
 * "Related" section. Dedupes, excludes self, caps the count.
 */
export async function getRelatedEntities(
  entity: (BaseEntity & Record<string, unknown>) | undefined,
  limit = 9,
): Promise<BaseEntity[]> {
  if (!entity) return [];
  const refs: Array<{ type: string; slug: string }> = [];
  const addAll = (type: string, slugs?: unknown) =>
    (Array.isArray(slugs) ? slugs : []).forEach((s) => typeof s === 'string' && s && refs.push({ type, slug: s }));
  const addOne = (type: string, slug?: unknown) => {
    if (typeof slug === 'string' && slug) refs.push({ type, slug });
  };

  switch (entity.type) {
    case 'company':
      addAll('company', entity.competitors);
      addAll('technology', entity.technologies);
      addOne('industry', entity.industry);
      addOne('country', entity.country);
      break;
    case 'country':
      addAll('industry', entity.industries);
      addAll('technology', entity.technologies);
      break;
    case 'industry':
      addAll('country', entity.top_countries);
      addAll('company', entity.key_companies);
      addAll('technology', entity.related_technologies);
      break;
    case 'technology':
      addAll('company', entity.key_companies);
      addAll('technology', entity.related_technologies);
      break;
    default:
      break;
  }

  const seen = new Set<string>([`${entity.type}:${entity.slug}`]);
  const unique = refs
    .filter((r) => {
      const k = `${r.type}:${r.slug}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit);

  const resolved = await Promise.all(
    unique.map((r) => fetchOne<BaseEntity>(r.type, r.slug, STATIC[r.type] || [])),
  );
  return resolved.filter(Boolean) as BaseEntity[];
}

/**
 * Generic entity fetcher for unified discovery flows.
 */
export async function getEntityBySlug(type: EntityType, slug: string): Promise<BaseEntity | undefined> {
  switch (type) {
    case 'country': return getCountryBySlug(slug);
    case 'company': return getCompanyBySlug(slug);
    case 'industry': return getIndustryBySlug(slug);
    case 'technology': return getTechnologyBySlug(slug);
    default: return undefined;
  }
}

// --- Bulk Retrievals ---

export async function getAllCountries() { return loadCountries(); }
export async function getAllCompanies() { return loadCompanies(); }
export async function getAllIndustries() { return loadIndustries(); }
export async function getAllTechnologies() { return loadTechnologies(); }
