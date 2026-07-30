import * as transparencyMock from '@/services/mock-api/transparency';
import { articlesService } from '@/services/data/articles-service';
import { getCreators } from '@/services/data/creators-service';
import { ApiResponse } from '@/types';
import { TransparencyData } from '@/types/system';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Platform-level system data. Used only for the public Transparency
 * page's real, verifiable figures (published article count, contributor count).
 *
 * This file previously carried ~40 more functions (settings, security dashboards,
 * CDN/edge/SEO management, audit logs, feature flags, admin overviews, etc.) — all
 * of them backed entirely by `@/services/mock-api/system` fabricated data, and all
 * confirmed to have zero real consumers anywhere in the app (no admin UI was ever
 * built against them). Removed rather than carried forward as unreachable dead code
 * with a fake-data trap waiting for the first page that imports one of them.
 */
export const systemService = {
  // Real published-article count + real contributor count; the rest of the page is
  // static policy content (no moderation/editorial/quality analytics backend exists
  // for Imperialpedia today — see `@/types/system` for why that shape was removed
  // rather than filled with invented numbers).
  async getTransparencyData(): Promise<ApiResponse<TransparencyData | null>> {
    try {
      const [articlesPage, creatorsRes] = await Promise.all([
        articlesService.getArticles(1, 1),
        getCreators(),
      ]);
      return {
        data: {
          metrics: {
            articles_published: articlesPage.pagination?.totalItems ?? 0,
            contributors: (creatorsRes.data ?? []).length,
          },
          policies: [
            { title: 'Editorial Policy', description: 'How our editorial team sources, reviews, and publishes intelligence content.', href: '/editorial-policy' },
            { title: 'Ethics Policy', description: 'Our standards for conflicts of interest, sourcing, and journalistic integrity.', href: '/ethics-policy' },
            { title: 'Comment Policy', description: 'How community discussion and moderation works on Imperialpedia.', href: '/comment-policy' },
            { title: 'Corrections', description: 'How we handle and disclose factual corrections to published content.', href: '/corrections' },
          ],
        },
        status: 200,
      };
    } catch (error) {
      // Real outage fallback, not fabricated data: fixed 0/0 metrics + the same real,
      // static policy links (see mock-api/transparency.ts's own doc comment).
      try {
        return await transparencyMock.getTransparencyData();
      } catch {
        const appError = errorHandler.handleError(error);
        return {
          data: null,
          status: appError.statusCode,
          error: appError.message,
        };
      }
    }
  }
};
