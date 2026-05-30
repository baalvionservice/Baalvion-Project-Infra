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
      return {
        data: cmsContentToArticle(raw),
        success: true,
        statusCode: 200,
        message: "Article retrieved successfully",
        timestamp: nowIso(),
      };
    } catch (error) {
      // Unknown slug in CMS (404) or cms-service down → try the legacy mock by slug so
      // pre-existing internal links keep resolving during the incremental migration.
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
