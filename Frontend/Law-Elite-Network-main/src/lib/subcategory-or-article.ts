import seedData from '../../docs/seed-data.json';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { categoriesPublicApi, subcategoriesPublicApi } from '@/lib/api/client';

/**
 * /law/[categorySlug]/[subSlug] is ambiguous by design: the second segment is a
 * real subcategory for bundled taxonomy, but CMS-sourced articles have no
 * subcategory at all (see article-url.ts), so their canonical URL is
 * /law/{category}/{article-slug} -- same shape, one segment shorter. This
 * resolves which case a request is, so the route can render the subcategory hub
 * or fall back to rendering the article, instead of 404ing every CMS article.
 */
export async function isKnownSubcategory(categorySlug: string, subSlug: string): Promise<boolean> {
  const seedMatch = ((seedData as any).subcategories || []).some((s: any) => s.slug === subSlug);
  if (seedMatch) return true;

  const bundledMatch = getArticlesByCategorySlug(categorySlug).some((a) => a.subcategory?.slug === subSlug);
  if (bundledMatch) return true;

  // subcategoriesController only filters by categoryId (no categorySlug param) --
  // resolve the id first, matching the pattern in law/[categorySlug]/[subSlug]/page.tsx.
  try {
    const catRes = await categoriesPublicApi.get(categorySlug);
    const catId = catRes.data?.data?.id;
    if (!catId) return false;
    const subsRes = await subcategoriesPublicApi.list({ categoryId: catId });
    const subs = subsRes?.data?.data || [];
    return subs.some((s: any) => s.slug === subSlug);
  } catch {
    return false;
  }
}
