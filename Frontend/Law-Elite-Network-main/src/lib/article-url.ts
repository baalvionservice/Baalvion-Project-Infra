/**
 * Canonical article URL: /{category}/{article-slug}. Subcategory is metadata
 * only (a filter chip on the category page via ?sub=, see CategoryContent.tsx)
 * and never appears in the URL. Only an article with no category at all falls
 * back to the flat /article/{slug} URL, via the redirect shim at
 * src/app/article/[slug]/page.tsx. Never construct a URL with a missing segment.
 */
export function articleUrl(article: {
  slug?: string | null;
  category?: { slug?: string | null } | null;
} | null | undefined): string {
  const slug = article?.slug;
  if (!slug) return '/';

  const categorySlug = article?.category?.slug;
  if (categorySlug) {
    return `/${categorySlug}/${slug}`;
  }
  return `/article/${slug}`;
}
