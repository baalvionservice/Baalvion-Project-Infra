import { notFound, permanentRedirect } from 'next/navigation';
import { OLD_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

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
