import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';

/**
 * A small, explicit set of standalone guides (personal-injury lead-gen vertical:
 * boating accidents, car accidents) whose approved URL is a bare root slug with
 * no category or /article/ prefix, unlike every other article on the site.
 * Listed explicitly here -- rather than derived from category or content shape
 * -- so adding one of these can never accidentally flatten the URL of an
 * unrelated, categorized article. src/app/[categorySlug]/page.tsx imports this
 * same set to know when an unmatched single path segment should render as an
 * article instead of 404ing as an unknown category.
 */
export const ROOT_FLAT_ARTICLE_SLUGS = new Set([
  'boating-accident-lawyer',
  'what-to-do-after-a-boating-accident',
  'boating-accident-statute-of-limitations',
  'boating-accident-liability-and-fault',
  'best-car-accident-lawyer',
  'what-does-a-car-accident-lawyer-do',
]);

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

  if (ROOT_FLAT_ARTICLE_SLUGS.has(slug)) return `/${slug}`;

  const categorySlug = article?.category?.slug;
  if (categorySlug && (CURRENT_CATEGORY_SLUGS as readonly string[]).includes(categorySlug)) {
    return `/${categorySlug}/${slug}`;
  }
  return `/article/${slug}`;
}
