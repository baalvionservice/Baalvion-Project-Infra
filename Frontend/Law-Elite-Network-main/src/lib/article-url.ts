/**
 * Canonical article URL: /law/{category}/{subcategory}/{article-slug}. Nesting
 * under category + subcategory (rather than a flat /article/{slug}) gives Google
 * a clear topical-silo signal and matches how the site's own category/subcategory
 * hub pages are already structured.
 *
 * Bundled articles always carry both category and subcategory slugs. CMS-sourced
 * articles only carry category (cms.ts's toArticle() has no subcategory field) --
 * for those, fall back to the flat /article/{slug} URL, which still resolves via
 * the redirect shim at src/app/article/[slug]/page.tsx. Never construct a URL with
 * a missing segment.
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
  return `/article/${slug}`;
}
