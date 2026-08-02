import { notFound, permanentRedirect } from 'next/navigation';
import { OLD_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';
import { isKnownSubcategory } from '@/lib/subcategory-or-article';

/**
 * Legacy /law/{category}/{subSlug} URLs were dual-purpose: a subcategory hub
 * page, or (when subSlug wasn't a real subcategory) a CMS article slug that
 * happened to sit in that URL slot. Subcategories no longer get a dedicated
 * URL -- they're a filter on the category page via ?sub= -- so a real
 * subcategory redirects to the category page with that filter preselected
 * (see CategoryContent.tsx's existing ?sub= deep-link handling). Otherwise
 * it was really an article, so it redirects straight to it.
 */
export default async function LegacySubcategoryRedirect(
  { params }: { params: Promise<{ categorySlug: string; subSlug: string }> },
) {
  const { categorySlug, subSlug } = await params;
  if (!OLD_CATEGORY_SLUGS.has(categorySlug)) notFound();

  const newCategorySlug = toNewCategorySlug(categorySlug);
  const isSubcategory = await isKnownSubcategory(newCategorySlug, subSlug);

  if (isSubcategory) {
    permanentRedirect(`/${newCategorySlug}?sub=${subSlug}`);
  }
  permanentRedirect(`/${newCategorySlug}/${subSlug}`);
}
