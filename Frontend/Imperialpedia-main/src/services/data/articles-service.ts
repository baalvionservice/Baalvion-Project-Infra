import * as mockApi from "@/services/mock-api/articles";
import {
  listCmsContent,
  getCmsContentBySlug,
  cmsContentToArticle,
} from "@/services/data/cms-public";
import { ApiResponse, PaginatedResponse } from "@/types";
import { Article } from "@/modules/content-engine/types/article";
import { errorHandler } from "@/lib/errors/error-handler";

/**
 * @fileOverview Abstraction layer for article-related data fetching.
 *
 * LIVE source of truth: content authored in admin-platform and *published* through the
 * Baalvion CMS (cms-service), read via its public delivery API (see `cms-public.ts`).
 *
 * Rollout strategy (incremental): real published CMS articles take precedence. When the
 * CMS has no published articles yet, or cms-service is unreachable, we fall back to the
 * legacy mock set so the page is never empty during cutover. Once editorial content is
 * flowing, the mock fallback simply never triggers.
 */

const nowIso = () => new Date().toISOString();

export const articlesService = {
  async getArticles(
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Article>> {
    try {
      const { items, total } = await listCmsContent({
        contentType: "article",
        page,
        limit,
      });

      if (items.length > 0) {
        const data = items.map(cmsContentToArticle);
        return {
          data,
          success: true,
          message: "Articles retrieved successfully",
          statusCode: 200,
          timestamp: nowIso(),
          pagination: {
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(total / limit)),
            pageSize: limit,
            totalItems: total,
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
          },
        };
      }
      // CMS reachable but no published articles yet → mock keeps the library populated.
      return await mockApi.getArticles(page, limit);
    } catch (error) {
      // Transport/availability failure → fall back to mock rather than break the page.
      const appError = errorHandler.handleError(error);
      try {
        return await mockApi.getArticles(page, limit);
      } catch {
        return {
          data: [],
          success: false,
          statusCode: appError.statusCode,
          message: appError.message,
          timestamp: nowIso(),
          path: "/api/articles",
          pagination: {
            currentPage: page,
            totalPages: 0,
            pageSize: limit,
            totalItems: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        };
      }
    }
  },

  async getArticleBySlug(slug: string): Promise<ApiResponse<Article | null>> {
    try {
      const raw = await getCmsContentBySlug(slug);
      // getCmsContentBySlug fetches by slug alone with no contentType filter, so a CMS
      // `page` document (About, Privacy, formerly AI Usage Policy, etc.) at this slug
      // would otherwise get blindly converted into a fake "article" and rendered here —
      // e.g. deleting a static page route like /ai-usage-policy would just resurface its
      // still-published CMS page content through this catch-all instead of 404ing.
      // Treat it as not-found so the normal 404 fallback chain below takes over.
      if (raw.contentType === 'page') {
        const err = new Error('CMS_NOT_FOUND') as Error & { status?: number };
        err.status = 404;
        throw err;
      }
      return {
        data: cmsContentToArticle(raw),
        success: true,
        statusCode: 200,
        message: "Article retrieved successfully",
        timestamp: nowIso(),
      };
    } catch (error) {
      // Only a *confirmed* CMS 404 (already survived cmsFetch's own retries)
      // means this slug genuinely doesn't exist — fall through to the legacy
      // mock/static content so pre-existing internal links keep resolving.
      // Anything else (timeout, 5xx, network drop) is a transient failure,
      // not proof the article is gone: measured directly, a burst of concurrent
      // requests produced dozens of these that resolved fine moments later on
      // a plain re-check. Silently treating that as "not found" here is how a
      // real, published article ends up rendering a hard 404 to Googlebot on a
      // bad day — which risks de-indexing content that's actually fine.
      // Rethrowing lets the page's render fail with a 5xx instead, which
      // crawlers retry rather than delist.
      if ((error as { status?: number })?.status !== 404) throw error;

      try {
        return await mockApi.getArticleBySlug(slug);
      } catch {
        const appError = errorHandler.handleError(error);
        return {
          data: null,
          success: false,
          statusCode: appError.statusCode,
          message: appError.message,
          timestamp: nowIso(),
          path: `/api/articles/${slug}`,
        };
      }
    }
  },

  async getArticlesByAuthor(
    authorSlug: string,
    page = 1,
    limit = 100
  ): Promise<PaginatedResponse<Article>> {
    try {
      const { items, total } = await listCmsContent({
        contentType: "article",
        authorSlug,
        page,
        limit,
      });
      return {
        data: items.map(cmsContentToArticle),
        success: true,
        message: "Articles retrieved successfully",
        statusCode: 200,
        timestamp: nowIso(),
        pagination: {
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          pageSize: limit,
          totalItems: total,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        success: false,
        statusCode: appError.statusCode,
        message: appError.message,
        timestamp: nowIso(),
        path: "/api/articles",
        pagination: {
          currentPage: page,
          totalPages: 0,
          pageSize: limit,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  },

  async getFeaturedArticles(): Promise<ApiResponse<Article[]>> {
    try {
      const { items } = await listCmsContent({ contentType: "article", limit: 6 });
      if (items.length > 0) {
        return {
          data: items.slice(0, 3).map(cmsContentToArticle),
          success: true,
          statusCode: 200,
          message: "Featured articles retrieved successfully",
          timestamp: nowIso(),
        };
      }
      return await mockApi.getFeaturedArticles();
    } catch (error) {
      try {
        return await mockApi.getFeaturedArticles();
      } catch {
        const appError = errorHandler.handleError(error);
        return {
          data: [],
          success: false,
          statusCode: appError.statusCode,
          message: appError.message,
          timestamp: nowIso(),
          path: "/api/articles/featured",
        };
      }
    }
  },
};
