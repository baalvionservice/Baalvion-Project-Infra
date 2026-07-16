/**
 * All content is now served live from the CMS — every category (including stocks
 * and economy, the last two that used to rely on a baked fallback) is published and
 * admin-editable in cms-service. The baked CMS-down snapshot this module used to read
 * (`src/generated/personal-finance-content.json`, produced by the retired
 * `content/*` spec pipeline) has been removed; these functions now always report
 * "not found in the fallback" so every caller falls through to the live CMS, which
 * is also the sole way to author or edit content going forward (via the admin panel).
 *
 * If a CMS-down safety net is needed again, `scripts/export-cms-snapshot.cjs` can
 * export the current live CMS content straight into a fresh baked snapshot.
 */
import type { CmsPage } from './cms-public';
import type { Article } from '@/modules/content-engine/types/article';
import type { NewsArticle } from '@/lib/data.news';

export function staticArticleList(): Article[] {
  return [];
}

export function staticArticleBySlug(_slug: string): Article | null {
  return null;
}

export function staticNewsBySlug(_slug: string): NewsArticle | null {
  return null;
}

export function staticCategoryNews(_categorySlug?: string): NewsArticle[] {
  return [];
}

export function staticPageBySlug(_slug: string): CmsPage | null {
  return null;
}
