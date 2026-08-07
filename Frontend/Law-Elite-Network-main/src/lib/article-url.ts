import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';

/**
 * Canonical article URL: /{category}/{article-slug}. Subcategory is metadata
 * only (a filter chip on the category page via ?sub=, see CategoryContent.tsx)
 * and never appears in the URL. An article with no category at all, or whose
 * category slug isn't one of the site's 8 real category pages (the CMS lets
 * an article be tagged with an arbitrary/legacy category string that has no
 * route -- e.g. a narrow one-off like `criminal-law-dui-defense` instead of
 * `criminal-law`), falls back to the flat /article/{slug} URL via the redirect
 * shim at src/app/article/[slug]/page.tsx. Never construct a URL segment that
 * [categorySlug]/page.tsx would 404 on -- this fallback is what sitemap.ts
 * relies on to avoid shipping a dead link to every crawler that fetches it.
 */
export function articleUrl(article: {
  slug?: string | null;
  category?: { slug?: string | null } | null;
} | null | undefined): string {
  const slug = article?.slug;
  if (!slug) return '/';

  const categorySlug = article?.category?.slug;
  if (categorySlug && (CURRENT_CATEGORY_SLUGS as readonly string[]).includes(categorySlug)) {
    return `/${categorySlug}/${slug}`;
  }
  return `/article/${slug}`;
}
