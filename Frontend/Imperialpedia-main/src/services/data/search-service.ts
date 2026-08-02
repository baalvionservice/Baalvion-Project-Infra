import { ApiResponse, SearchResult, AdvancedSearchFilters } from '@/types';
import type { SearchResultType } from '@/types/search';
import { errorHandler } from '@/lib/errors/error-handler';
import { sortByRelevance } from '@/lib/utils/search';
import { GLOSSARY_LIVE } from '@/config/glossary';

/**
 * @fileOverview Global Search — LIVE across imperialpedia-service (entities/creators/assets)
 * AND the CMS published content (articles/news). No mock fallback: an honest empty
 * result set when both upstreams are unreachable or have no matches, rather than
 * fabricated search results.
 */

// Localhost is a dev-only default; production resolves to ''.
const IS_PROD = process.env.NODE_ENV === 'production';
const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || (IS_PROD ? '' : 'http://localhost:3004/api/v1');
const CMS_PUBLIC =
  process.env.NEXT_PUBLIC_CMS_PUBLIC_URL || (IS_PROD ? '' : 'http://localhost:3018/api/v1/public');
const SITE = process.env.NEXT_PUBLIC_CMS_SITE_SLUG || 'imperialpedia';

const TYPE_MAP: Record<string, SearchResultType> = {
  company: 'company', country: 'country', industry: 'industry', technology: 'technology',
  article: 'article', author: 'author', term: 'glossary', review: 'article', asset: 'market',
  news: 'article', page: 'article',
};

const routeFor = (type: string, slug: string, name: string): string => {
  switch (type) {
    case 'company': return `/companies/${slug}`;
    case 'country': return `/countries/${slug}`;
    case 'industry': return `/industries/${slug}`;
    case 'technology': return `/technologies/${slug}`;
    case 'term': {
      const c = (name || slug).charAt(0).toLowerCase() || 'a';
      return `/terms/${/^[0-9]/.test(c) ? 'num' : c}/${slug}`;
    }
    case 'review': return `/${slug}`;
    // imperialpedia-service's /search returns assets keyed by ticker symbol as
    // their slug (same convention as getAssetQuote(symbol)/getAllMarketAssets),
    // so this resolves straight to the real per-asset quote page.
    case 'asset': return `/markets/quote/${slug}`;
    case 'author': return `/creators`;
    case 'article': return `/financial-intelligence/${slug}`;
    default: return `/${slug}`;
  }
};

const j = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
};

export const searchService = {
  async performSearch(query: string, filters?: AdvancedSearchFilters): Promise<ApiResponse<SearchResult[]>> {
    const q = (query || '').trim();
    if (!q) return { data: [], status: 200 };
    try {
      const [imp, arts, news] = await Promise.allSettled([
        j(`${IMP_API}/search?q=${encodeURIComponent(q)}`),
        j(`${CMS_PUBLIC}/${SITE}/content?contentType=article&search=${encodeURIComponent(q)}`),
        j(`${CMS_PUBLIC}/${SITE}/content?contentType=news&search=${encodeURIComponent(q)}`),
      ]);

      const out: SearchResult[] = [];
      if (imp.status === 'fulfilled') {
        for (const r of imp.value?.data ?? []) {
          // Glossary is offline pending AdSense approval (src/config/glossary.ts) —
          // don't surface search results that would route to a 404'd term page.
          if (!GLOSSARY_LIVE && r.type === 'term') continue;
          out.push({
            id: `${r.type}-${r.slug}`,
            type: TYPE_MAP[r.type] || 'topic',
            title: r.name,
            snippet: r.description || '',
            route: routeFor(r.type, r.slug, r.name),
            category: r.category,
          });
        }
      }
      const pushContent = (env: { data?: unknown[] } | undefined, kind: string) => {
        for (const c of (env?.data ?? []) as Array<{ slug: string; title: string; excerpt?: string; category?: { name?: string; slug?: string }; publishedAt?: string }>) {
          const route =
            kind === 'article'
              ? c.category?.slug
                ? `/${c.category.slug}/${c.slug}`
                : `/financial-intelligence/${c.slug}`
              : `/${c.slug}`;
          out.push({
            id: `${kind}-${c.slug}`,
            type: 'article',
            title: c.title,
            snippet: c.excerpt || '',
            route,
            category: c.category?.name,
            date: c.publishedAt,
          });
        }
      };
      if (arts.status === 'fulfilled') pushContent(arts.value, 'article');
      if (news.status === 'fulfilled') pushContent(news.value, 'news');

      // de-dupe by id, then rank by relevance — previously the merge order was
      // whatever the upstream sources happened to return (imperialpedia-service
      // results always first, then articles, then news), not actual match quality.
      const seen = new Set<string>();
      const deduped = out.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
      const ranked = sortByRelevance(deduped, q);
      return { data: ranked, status: 200 };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },
};
