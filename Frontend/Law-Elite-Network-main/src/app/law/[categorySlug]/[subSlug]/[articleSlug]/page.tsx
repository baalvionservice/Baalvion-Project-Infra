import { permanentRedirect } from 'next/navigation';
import { toNewCategorySlug } from '@/lib/category-slugs';

/**
 * Legacy 3-segment article URLs (/law/{category}/{subcategory}/{article})
 * were always an unambiguous real article -- no lookup needed, just redirect
 * to the flattened /{category}/{article} route. Kept live indefinitely.
 */
export default async function LegacyArticleRedirect(
  { params }: { params: Promise<{ categorySlug: string; subSlug: string; articleSlug: string }> },
) {
  const { categorySlug, articleSlug } = await params;
  permanentRedirect(`/${toNewCategorySlug(categorySlug)}/${articleSlug}`);
}
