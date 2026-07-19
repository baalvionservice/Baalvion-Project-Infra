import { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata-builder';

/**
 * @fileOverview Specialized utility for generating high-fidelity SEO metadata for entities.
 * Supports Countries, Companies, Industries, and Technologies.
 */

/**
 * Maps an entity type to its actual route segment. A naive `${type}s` produces
 * broken plurals (e.g. "technologys", "companys") that 404 — which is fatal for
 * canonical tags. Keep this aligned with the `src/app/<segment>/[slug]` routes.
 */
const ENTITY_ROUTE_SEGMENT: Record<string, string> = {
  country: 'countries',
  company: 'companies',
  industry: 'industries',
  technology: 'technologies',
};

export function entityRouteSegment(type: string): string {
  return ENTITY_ROUTE_SEGMENT[type] || `${type}s`;
}

/** Turns a data slug like "consumer-electronics" into "Consumer Electronics". */
export function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Single source of truth for "is this company publicly traded" — every consumer
 * (JSON-LD `@type`, Key Facts Stock/Ownership row, quick stats) must call this rather
 * than reading `company.isPublic` directly. The field is an optional editorial hint that
 * agrees with ticker presence in the bundled fallback data, but live-service records could
 * set one without the other; ticker presence is the actual ground truth.
 */
export function isPublicCompany(company: { isPublic?: boolean; ticker?: string | null }): boolean {
  return company.isPublic ?? Boolean(company.ticker);
}

/** Parses a URL for display purposes only; returns null instead of throwing on bad input. */
export function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function generateEntityMetadata(entity: any, type: string): Metadata {
  const name = entity.name || 'Unknown Entity';
  const description = entity.description || '';
  const tags = entity.tags || [];

  // Create specialized titles and descriptions based on entity type
  let seoTitle = '';
  let seoDescription = '';

  switch (type) {
    case 'country':
      seoTitle = `${name} | Global Economic Profile & Intelligence`;
      seoDescription = `Audit ${name}'s economic benchmarks, population data, and market reach. Part of the Imperialpedia Sovereign Index.`;
      break;
    case 'company': {
      // Built from the entity's own verified fields so every company gets a genuinely
      // unique, factual description instead of one templated sentence repeated site-wide.
      const facts = [
        entity.industry && `${humanizeSlug(entity.industry)} industry`,
        entity.founded_year && `founded ${entity.founded_year}`,
        entity.headquarters && `headquartered in ${entity.headquarters}`,
      ].filter(Boolean).join(', ');
      seoTitle = `${name} | Company Profile, Founders & Key Facts`;
      seoDescription = facts
        ? `${name}: ${facts}.${entity.ticker ? ` Track ${entity.ticker} live quotes,` : ''} explore leadership, competitors, and related companies.`
        : `Explore ${name}'s founding history, industry position, and competitors. Verified institutional data.`;
      break;
    }
    case 'industry':
      seoTitle = `${name} | Market Architecture & Sector Intelligence`;
      seoDescription = `Trace the global scale and growth velocity of the ${name} sector. Analyze key players and innovation nodes.`;
      break;
    case 'technology':
      seoTitle = `${name} | Innovation Node & Technical Analysis`;
      seoDescription = `Deep-dive into ${name}. Explore core applications, market impact, and institutional implementation benchmarks.`;
      break;
    default:
      seoTitle = `${name} | Knowledge Node`;
      seoDescription = description;
  }

  return buildMetadata({
    title: seoTitle,
    description: seoDescription,
    keywords: [...tags, type, 'intelligence', 'analytics'],
    canonical: `/${entityRouteSegment(type)}/${entity.slug}`,
    ogType: 'article',
    // Only overrides the default OG image when the entity has a verified logo — never
    // falls back to a placeholder graphic that would misrepresent the entity.
    ogImage: entity.logo || undefined,
  });
}
