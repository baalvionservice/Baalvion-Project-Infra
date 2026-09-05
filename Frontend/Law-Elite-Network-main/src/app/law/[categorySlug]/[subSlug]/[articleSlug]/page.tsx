import { permanentRedirect } from 'next/navigation';
import { toNewCategorySlug } from '@/lib/category-slugs';

/**
 * Empty on purpose. These legacy URLs only ever 301 to the flattened route, but
 * without a generateStaticParams export Next treats the route as fully dynamic
 * and runs a server render to produce that redirect on every single hit --
 * paying Fluid CPU and an origin transfer to emit a Location header. Returning
 * [] registers it as ISR instead, so the redirect is computed once and cached.
 */
export async function generateStaticParams(): Promise<{ categorySlug: string; subSlug: string; articleSlug: string }[]> {
  return [];
}

export const revalidate = 86400;

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
