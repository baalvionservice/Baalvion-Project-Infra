import type { Metadata } from 'next';
import { getArticlesByCategorySlug } from '@/data/law-content';
import seedData from '../../../../../docs/seed-data.json';

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

async function fetchJson(path: string): Promise<any[]> {
  if (!/^https?:\/\//i.test(`${API}${path}`)) return [];
  try {
    const r = await fetch(`${API}${path}`, { next: { revalidate: 3600 } });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j?.data) ? j.data : (j?.data?.items || []);
  } catch {
    return [];
  }
}

/** Resolve category + subcategory display names from the API, then bundled seed/articles. */
async function resolveTaxonomy(
  categorySlug: string,
  subSlug: string,
): Promise<{ categoryName: string; subName: string }> {
  const [categories, subcategories] = await Promise.all([
    fetchJson('/categories'),
    fetchJson(`/subcategories?categorySlug=${encodeURIComponent(categorySlug)}`),
  ]);

  const apiCat = categories.find((c: any) => c.slug === categorySlug);
  const apiSub = subcategories.find((s: any) => s.slug === subSlug);

  const seedCat = (seedData as any).categories?.find((c: any) => c.slug === categorySlug);
  const seedSub = ((seedData as any).subcategories || []).find((s: any) => s.slug === subSlug);

  // Bundled article match is the final authority for naming a real subcategory.
  const bundledMatch = getArticlesByCategorySlug(categorySlug).find(
    (a) => a.subcategory.slug === subSlug,
  );

  const categoryName = apiCat?.name || seedCat?.name || bundledMatch?.category.name || titleCase(categorySlug);
  const subName = apiSub?.name || seedSub?.name || bundledMatch?.subcategory.name || titleCase(subSlug);

  return { categoryName, subName };
}

/** Count bundled articles in this subcategory — drives the noindex-when-empty rule. */
function bundledCount(categorySlug: string, subSlug: string): number {
  return getArticlesByCategorySlug(categorySlug).filter((a) => a.subcategory.slug === subSlug).length;
}

export async function generateMetadata(
  { params }: { params: Promise<{ categorySlug: string; subSlug: string }> },
): Promise<Metadata> {
  const { categorySlug, subSlug } = await params;
  const { categoryName, subName } = await resolveTaxonomy(categorySlug, subSlug);

  const title = `${subName} — ${categoryName} Guides | Law Elite Network`;
  const description =
    `Read expert ${subName} explainers within ${categoryName} law on Law Elite Network — clear, worldwide legal guides written for a general audience.`;
  const url = `${SITE}/law/${categorySlug}/${subSlug}`;

  // Thin/empty subcategories must not be indexed. The bundled baseline mirrors what
  // the page renders when the API is unreachable, so it is a safe floor for this check.
  const hasArticles = bundledCount(categorySlug, subSlug) > 0;

  return {
    title,
    description,
    keywords: [subName, `${subName} law`, `${categoryName} ${subName}`, 'legal guides', 'law explainers'],
    alternates: { canonical: url },
    robots: hasArticles ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', url, title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function SubcategoryLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ categorySlug: string; subSlug: string }> },
) {
  const { categorySlug, subSlug } = await params;
  const { categoryName, subName } = await resolveTaxonomy(categorySlug, subSlug);
  const url = `${SITE}/law/${categorySlug}/${subSlug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${subName} — ${categoryName} Guides`,
    description: `Expert ${subName} legal guides within ${categoryName} on Law Elite Network.`,
    url,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE}/law/${categorySlug}` },
      { '@type': 'ListItem', position: 3, name: subName, item: url },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
