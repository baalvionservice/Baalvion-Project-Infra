/**
 * Canonical article URL: /law/{category}/{subcategory}/{article-slug}, or
 * /law/{category}/{article-slug} when there's no subcategory. Nesting under
 * category (+ subcategory when known) rather than a flat /article/{slug} gives
 * Google a clear topical-silo signal, matches how the site's own category/
 * subcategory hub pages are already structured, and keeps "article" out of
 * every indexable URL.
 *
 * Bundled articles always carry both category and subcategory slugs. CMS-sourced
 * articles only carry category (cms.ts's toArticle() has no subcategory field) --
 * those resolve to the 2-segment form, which src/app/law/[categorySlug]/[subSlug]/
 * page.tsx renders directly (falling back to an article lookup whenever the
 * second segment isn't a real subcategory). Only an article with no category at
 * all falls back to the flat /article/{slug} URL, via the redirect shim at
 * src/app/article/[slug]/page.tsx. Never construct a URL with a missing segment.
 */
export function articleUrl(article: {
  slug?: string | null;
  category?: { slug?: string | null } | null;
  subcategory?: { slug?: string | null } | null;
} | null | undefined): string {
  const slug = article?.slug;
  if (!slug) return '/';

  const categorySlug = article?.category?.slug;
  const subcategorySlug = article?.subcategory?.slug;
  if (categorySlug && subcategorySlug) {
    return `/law/${categorySlug}/${subcategorySlug}/${slug}`;
  }
  if (categorySlug) {
    return `/law/${categorySlug}/${slug}`;
  }
  return `/article/${slug}`;
}
