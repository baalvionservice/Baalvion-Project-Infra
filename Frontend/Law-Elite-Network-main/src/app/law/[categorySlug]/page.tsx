import { notFound, permanentRedirect } from 'next/navigation';
import { OLD_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

/**
 * Empty on purpose. These legacy URLs only ever 301 to the flattened route, but
 * without a generateStaticParams export Next treats the route as fully dynamic
 * and runs a server render to produce that redirect on every single hit --
 * paying Fluid CPU and an origin transfer to emit a Location header. Returning
 * [] registers it as ISR instead, so the redirect is computed once and cached.
 */
export async function generateStaticParams(): Promise<{ categorySlug: string }[]> {
  return [];
}

export const revalidate = 86400;

/**
 * Legacy /law/{category} URLs redirect to the flattened /{category} route.
 * Kept live indefinitely (not deleted) so Google keeps crediting the old
 * indexed URLs -- see src/app/robots.ts, which keeps /law/ crawlable.
 */
export default async function LegacyCategoryRedirect(
  { params }: { params: Promise<{ categorySlug: string }> },
) {
  const { categorySlug } = await params;
  if (!OLD_CATEGORY_SLUGS.has(categorySlug)) notFound();
  permanentRedirect(`/${toNewCategorySlug(categorySlug)}`);
}
