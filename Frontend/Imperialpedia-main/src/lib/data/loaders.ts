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
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3004/api/v1');

const STATIC: Record<string, unknown[]> = {
  country: countriesData as unknown[],
  company: companiesData as unknown[],
  industry: industriesData as unknown[],
  technology: technologiesData as unknown[],
};

// `cache: 'no-store'` (the previous setting) forces full dynamic rendering on
// every route that calls these — confirmed directly in a production build
// (/companies/[slug] etc. still rendered as ƒ/dynamic despite the page's own
// `revalidate = 300` export). admin-platform's entity editor has no
// on-save revalidation call (unlike CMS content, which cms-service pings
// via /api/revalidate on publish), so a short window here — not the long one
// used for webhook-backed CMS content — is the ceiling on how stale an edit
// can appear: 60s, not indefinitely no-store, but still bounded and fast.
const ENTITY_REVALIDATE_SECONDS = 60;

const ENTITY_PAGE_SIZE = 500; // imperialpedia-service's own hard cap (entitiesController.js)

// List a type from the service; fall back to bundled static data on empty/error.
// Walks every page rather than trusting a single limit=500 request to be enough —
// today's roster (companies/countries/technologies each in the tens) fits in one
// page, but the roadmap calls for company profiles "at scale" (thousands), and a
// single-page fetch would then silently drop everything past the first 500 with
// no error, the same class of bug that under-collected the article sitemap (see
// articles-service.ts) just without even a page-walk attempt to catch it.
async function fetchList<T>(type: string, fallback: unknown[]): Promise<T[]> {
  const items: unknown[] = [];
  try {
    // Page 1 failing means the service is genuinely unreachable/erroring — fall
    // back to bundled static data entirely, same as the original single-request
    // behavior.
    const first = await fetch(`${IMP_API}/entities?type=${type}&limit=${ENTITY_PAGE_SIZE}&page=1`, {
      next: { revalidate: ENTITY_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (!first.ok) throw new Error(String(first.status));
    const firstJson = await first.json();
    const firstItems: unknown[] = firstJson?.data?.items ?? [];
    items.push(...firstItems);
    const total = firstJson?.data?.pagination?.total ?? firstItems.length;
    // Derive from the actual page size returned, not the requested limit — the
    // service may itself cap lower than what was asked for.
    const totalPages = Math.max(1, Math.ceil(total / Math.max(firstItems.length, 1)));

    // A later page failing (transient blip) shouldn't discard the real data
    // page 1 already returned — keep what we have instead of falling back to
    // possibly-stale bundled JSON.
    for (let page = 2; page <= totalPages; page++) {
      try {
        const res = await fetch(`${IMP_API}/entities?type=${type}&limit=${ENTITY_PAGE_SIZE}&page=${page}`, {
          next: { revalidate: ENTITY_REVALIDATE_SECONDS },
          signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) break;
        const json = await res.json();
        items.push(...(json?.data?.items ?? []));
      } catch {
        break;
      }
    }
    return (items.length > 0 ? items : fallback) as T[];
  } catch {
    return items.length > 0 ? (items as T[]) : (fallback as T[]);
  }
}

// Fetch one by slug; fall back to the static set on 404/error so legacy links resolve.
async function fetchOne<T>(type: string, slug: string, fallback: unknown[]): Promise<T | undefined> {
  try {
    const res = await fetch(`${IMP_API}/entities/${type}/${encodeURIComponent(slug)}`, {
      next: { revalidate: ENTITY_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
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

/**
 * Reverse lookup for the market quote pages (`/markets/quote/[symbol]`): finds the rich
 * knowledge-graph `CompanyEntity` behind a ticker so quote pages can surface real
 * description/leadership/headquarters/sameAs data instead of only the bare price feed.
 * Reuses `loadCompanies()`'s existing cache — no dedicated backend lookup needed since the
 * company roster is small (tens, not thousands) and already fully loaded for `/companies`.
 */
export async function getCompanyByTicker(ticker: string): Promise<CompanyEntity | undefined> {
  const companies = await loadCompanies();
  const needle = ticker.toUpperCase();
  return companies.find((c) => c.ticker?.toUpperCase() === needle);
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

// --- Live market data (imperialpedia-service /assets, synced from cms-service) ---
// No static fallback here (unlike entities) — a live price is either real or absent;
// showing a stale bundled number would misrepresent it as current.
export interface AssetQuote {
  symbol: string;
  name: string;
  asset_type: string;
  exchange: string | null;
  current_price: number | null;
  change_pct_24h: number | null;
  market_cap: number | null;
  volume_24h: number | null;
  ai_summary: string | null;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  last_updated_at: string | null;
}

export async function getAssetQuote(symbol: string): Promise<AssetQuote | undefined> {
  try {
    // Rendered inside LiveQuoteCard on every ticketed company's /companies/[slug]
    // sidebar — no-store here forced the ENTIRE page dynamic (Key Facts,
    // Editorial Overview, everything), not just this one widget: a no-store
    // fetch anywhere in the render tree marks the whole route dynamic even
    // inside a Suspense boundary, without Partial Prerendering enabled. 30s
    // matches the same window marketsLoader.ts already uses for asset data.
    const res = await fetch(`${IMP_API}/assets/${encodeURIComponent(symbol)}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return undefined;
    const json = await res.json();
    return json?.data ?? undefined;
  } catch {
    return undefined;
  }
}
