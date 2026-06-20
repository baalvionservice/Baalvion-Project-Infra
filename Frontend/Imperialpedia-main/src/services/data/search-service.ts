import * as mockApi from '@/services/mock-api/search';
import { ApiResponse, SearchResult, SearchSuggestion, AdvancedSearchFilters, TopicRecommendation } from '@/types';
import type { SearchResultType } from '@/types/search';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Global Search — LIVE across imperialpedia-service (entities/creators/assets)
 * AND the CMS published content (articles/news). Mock fallback when both are unreachable/empty.
 */

// Localhost is a dev-only default; production resolves to '' (search falls back to
// mock when the upstreams are unreachable) so no dev URL ships in the prod bundle.
const IS_PROD = process.env.NODE_ENV === 'production';
const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || (IS_PROD ? '' : 'http://localhost:3004/api/v1');
const CMS_PUBLIC =
  process.env.NEXT_PUBLIC_CMS_PUBLIC_URL || (IS_PROD ? '' : 'http://localhost:3018/api/v1/public');
const SITE = process.env.NEXT_PUBLIC_CMS_SITE_SLUG || 'imperialpedia';

const TYPE_MAP: Record<string, SearchResultType> = {
  company: 'company', country: 'country', industry: 'industry', technology: 'technology',
  article: 'article', author: 'author', term: 'glossary', review: 'article', asset: 'topic',
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
    case 'asset': return `/market`;
    case 'author': return `/creators`;
    case 'article': return `/articles/${slug}`;
    default: return `/${slug}`;
  }
};

const j = async (url: string) => {
  const r = await fetch(url, { cache: 'no-store' });
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
        for (const c of (env?.data ?? []) as Array<{ slug: string; title: string; excerpt?: string; category?: { name?: string }; publishedAt?: string }>) {
          out.push({
            id: `${kind}-${c.slug}`,
            type: 'article',
            title: c.title,
            snippet: c.excerpt || '',
            route: kind === 'article' ? `/articles/${c.slug}` : `/${c.slug}`,
            category: c.category?.name,
            date: c.publishedAt,
          });
        }
      };
      if (arts.status === 'fulfilled') pushContent(arts.value, 'article');
      if (news.status === 'fulfilled') pushContent(news.value, 'news');

      if (out.length > 0) {
        // de-dupe by id, keep order
        const seen = new Set<string>();
        const deduped = out.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
        return { data: deduped, status: 200 };
      }
      return await mockApi.globalSearch(q, filters);
    } catch (error) {
      try { return await mockApi.globalSearch(q, filters); } catch {
        const appError = errorHandler.handleError(error);
        return { data: [], status: appError.statusCode, error: appError.message };
      }
    }
  },

  async getSuggestions(query: string): Promise<ApiResponse<SearchSuggestion[]>> {
    try {
      return await mockApi.getSearchSuggestions(query);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },

  async getPopularContent(): Promise<ApiResponse<SearchResult[]>> {
    try {
      return await mockApi.getPopularContent();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },

  async getRecommendedTopics(query?: string): Promise<ApiResponse<TopicRecommendation[]>> {
    try {
      return await mockApi.getRecommendedTopics(query);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return { data: [], status: appError.statusCode, error: appError.message };
    }
  },
};
