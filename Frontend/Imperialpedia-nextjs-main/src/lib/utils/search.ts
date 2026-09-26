import { loadCountries } from '@/lib/data/loaders';
import { getAllMarketAssets } from '@/lib/data/marketsLoader';
import { entityRouteSegment } from '@/lib/utils/seo';
import { SearchResult, SearchResultType } from '@/types/search';

/**
 * @fileOverview Core relevance/ranking engine for the knowledge-graph search surface.
 *
 * Replaces the previous implementation, which matched against `@/data/*.json` — flat,
 * orphaned fixture files each containing exactly one seeded record left over from before
 * the `data/<type>/<type>.json` restructure. This now reads from the same live-first,
 * static-fallback loaders (`lib/data/loaders.ts`) that power `/countries`, plus the
 * live market-asset feed, so a search result can never be staler or thinner than what
 * the index pages themselves show.
 */

const MAX_LEVENSHTEIN_LEN = 12; // bound the DP table for pathological input lengths

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = Math.min(a.length, MAX_LEVENSHTEIN_LEN);
  const bl = Math.min(b.length, MAX_LEVENSHTEIN_LEN);
  if (al === 0) return bl;
  if (bl === 0) return al;

  const prev = new Array(bl + 1);
  const curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= bl; j++) prev[j] = curr[j];
  }
  return prev[bl];
}

/** True when `word` is within a typo-tolerant edit distance of `query` — scaled by
 * length so short queries ("aple") still tolerate 1 typo without matching everything. */
function isFuzzyMatch(word: string, query: string): boolean {
  if (Math.abs(word.length - query.length) > 2) return false;
  const maxDistance = query.length <= 4 ? 1 : query.length <= 8 ? 2 : 3;
  return levenshtein(word, query) <= maxDistance;
}

/**
 * Scores how well a single text field matches the query. Exact/prefix/word-boundary
 * matches rank far above a bare substring hit; a fuzzy (typo-tolerant) match ranks
 * lowest of all so exact spelling always wins when both are present.
 */
function fieldScore(fieldValue: string | undefined, query: string): number {
  if (!fieldValue) return 0;
  const field = fieldValue.toLowerCase();
  if (field === query) return 100;
  if (field.startsWith(query)) return 80;

  const words = field.split(/[\s,/-]+/).filter(Boolean);
  if (words.includes(query)) return 70;
  if (words.some((w) => w.startsWith(query))) return 55;
  if (field.includes(query)) return 40;
  if (words.some((w) => isFuzzyMatch(w, query))) return 15;
  return 0;
}

interface Searchable {
  title: string;
  snippet?: string;
  category?: string;
  tags?: string[];
}

/** Field weighting: title > category > tags > snippet — a title hit is a far
 * stronger relevance signal than the same term appearing in a long description. */
function scoreItem(item: Searchable, query: string): number {
  const titleScore = fieldScore(item.title, query) * 3;
  const categoryScore = fieldScore(item.category, query) * 1.5;
  const tagScore = Math.max(0, ...(item.tags ?? []).map((t) => fieldScore(t, query))) * 1.75;
  const snippetScore = fieldScore(item.snippet, query) * 1;
  return titleScore + categoryScore + tagScore + snippetScore;
}

/**
 * Ranks any list of search-result-shaped items against a query. Used both by the
 * entity/market search below and by `search-service.ts` to rank its multi-source
 * (imperialpedia-service + CMS) merged results, which previously preserved whatever
 * order the upstream APIs happened to return.
 */
export function rankSearchResults<T extends Searchable>(items: T[], query: string, limit = 20): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return items
    .map((item) => ({ item, score: scoreItem(item, q) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

/**
 * Stable relevance sort that never drops items — unlike `rankSearchResults`, which
 * excludes zero-score items. Use this for results a server already filtered by full-text
 * match (e.g. CMS `?search=`), where the title/snippet/category alone might legitimately
 * score 0 even though the body text matched; dropping those would silently hide real hits.
 */
export function sortByRelevance<T extends Searchable>(items: T[], query: string): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return items;
  return items
    .map((item, index) => ({ item, index, score: scoreItem(item, q) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((s) => s.item);
}

function pushEntityResults(
  out: SearchResult[],
  data: Array<{ id: string; name: string; description: string; slug: string; category?: string; tags?: string[] }>,
  type: SearchResultType,
) {
  for (const item of data) {
    out.push({
      id: `${type}-${item.slug}`,
      type,
      title: item.name,
      snippet: item.description,
      route: `/${entityRouteSegment(type)}/${item.slug}`,
      category: item.category,
      tags: item.tags,
    });
  }
}

/**
 * Core search across the knowledge graph: countries and live market assets
 * (indices/stocks/crypto/commodities/currencies). Companies, industries, and
 * technologies are intentionally excluded — /companies, /industries, and
 * /technologies were removed site-wide, so those entities have no page to
 * route a search hit to.
 * People are intentionally not included — no `person` entity loader/backend exists yet
 * (tracked as a known gap; see docs/SEARCH_STANDARD.md).
 */
export async function searchEntities(query: string, limit = 20): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];

  const [countries, assets] = await Promise.all([
    loadCountries(),
    getAllMarketAssets(),
  ]);

  const results: SearchResult[] = [];
  pushEntityResults(results, countries, 'country');

  for (const asset of assets) {
    if (!asset.name || !asset.symbol) continue;
    results.push({
      id: `market-${asset.symbol}`,
      type: 'market',
      title: asset.name,
      snippet: `${asset.symbol} — live ${asset.asset_type} quote`,
      route: `/markets/quote/${asset.symbol}`,
      category: asset.asset_type,
      tags: [asset.symbol],
    });
  }

  return rankSearchResults(results, q, limit);
}
