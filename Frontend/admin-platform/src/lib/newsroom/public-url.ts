import { NEWS_REGIONS } from '@/lib/constants/news-taxonomy';

interface CategoryRef {
  id: string;
  slug: string;
  parentId: string | null;
}

const REGION_SLUGS = new Set(NEWS_REGIONS.filter((r) => r.slug !== 'world').map((r) => r.slug));

/**
 * Mirrors imperialpedia-main's `deriveWorldGeo` (cms-public.ts): a checked
 * category whose slug matches a known region is the region; whichever OTHER
 * checked category has that region as its parent is the country; and
 * (one level deeper) whichever checked category has THAT country as its
 * parent is the state/province. Kept in admin-platform so editors can
 * preview the exact live URL before publishing, without a round trip to
 * the public site.
 */
export function resolveWorldGeo(categoryIds: string[], categories: CategoryRef[]): { region?: string; country?: string; state?: string } {
  const byId = new Map(categories.map((c) => [c.id, c] as const));
  const checked = categoryIds.map((id) => byId.get(id)).filter((c): c is CategoryRef => !!c);
  const regionCat = checked.find((c) => REGION_SLUGS.has(c.slug));
  if (!regionCat) return {};
  const countryCat = checked.find((c) => c.parentId === regionCat.id);
  if (!countryCat) return { region: regionCat.slug };
  const stateCat = checked.find((c) => c.parentId === countryCat.id);
  return { region: regionCat.slug, country: countryCat.slug, state: stateCat?.slug };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Builds the canonical imperialpedia article path:
 *   - `/world/<region>/<country>/<state>/YYYY/MM/DD/<slug>` when region, country, AND state are tagged
 *   - `/world/<region>/<country>/YYYY/MM/DD/<slug>` when only region + country are tagged
 *   - `/YYYY/MM/DD/<slug>` otherwise (flat dated URL)
 * `dateSource` should be the article's `publishedAt` once known; falls back to "now"
 * for drafts that haven't published yet (Publish Now sets publishedAt to the moment
 * it goes live, so "now" is the accurate preview for that action).
 */
export function buildImperialpediaPath(params: {
  slug: string;
  dateSource?: string | null;
  categoryIds: string[];
  categories: CategoryRef[];
}): string {
  const { slug, dateSource, categoryIds, categories } = params;
  const parsed = dateSource ? new Date(dateSource) : new Date();
  const safe = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const datePath = `${safe.getUTCFullYear()}/${pad2(safe.getUTCMonth() + 1)}/${pad2(safe.getUTCDate())}`;
  const { region, country, state } = resolveWorldGeo(categoryIds, categories);
  const safeSlug = slug.trim() || 'untitled';
  if (region && country && state) return `/world/${region}/${country}/${state}/${datePath}/${safeSlug}`;
  if (region && country) return `/world/${region}/${country}/${datePath}/${safeSlug}`;
  return `/${datePath}/${safeSlug}`;
}
