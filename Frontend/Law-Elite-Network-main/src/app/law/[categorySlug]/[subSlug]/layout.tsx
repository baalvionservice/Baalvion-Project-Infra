import type { Metadata } from 'next';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { fetchArticleForMetadata } from '@/lib/article-metadata-fetch';
import { buildArticleMetadata, ArticleJsonLd } from '@/lib/seo/article-seo';
import { isKnownSubcategory } from '@/lib/subcategory-or-article';
import seedData from '../../../../../docs/seed-data.json';

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Hard cap so a slow/hung law-service response falls back to bundled/seed
// naming instead of blocking metadata generation and the page render.
const FETCH_TIMEOUT_MS = 4000;

async function fetchJson(path: string): Promise<any[]> {
  if (!/^https?:\/\//i.test(`${API}${path}`)) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(`${API}${path}`, { next: { revalidate: 3600 }, signal: controller.signal });
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j?.data) ? j.data : (j?.data?.items || []);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
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

  // /law/[categorySlug]/[subSlug] is ambiguous: a real subcategory hub, OR a
  // 2-segment CMS article URL (CMS content has no subcategory -- see
  // lib/subcategory-or-article.ts). Try the article path first since it's the
  // narrower, more specific match.
  if (!(await isKnownSubcategory(categorySlug, subSlug))) {
    const article = await fetchArticleForMetadata(subSlug);
    if (article) return buildArticleMetadata(article, subSlug, SITE);
  }

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

// CollectionPage/BreadcrumbList JSON-LD for the subcategory-hub case lives in
// page.tsx (a layout wraps every nested route below it, including the article
// route nested under this subcategory, which has its own more complete
// BreadcrumbList). The article-JSON-LD case (this segment resolving to a CMS
// article instead of a real subcategory) is rendered here since it applies
// uniformly regardless of which case page.tsx renders.
export default async function SubcategoryLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ categorySlug: string; subSlug: string }> },
) {
  const { categorySlug, subSlug } = await params;
  if (!(await isKnownSubcategory(categorySlug, subSlug))) {
    const article = await fetchArticleForMetadata(subSlug);
    if (article) {
      return (
        <>
          <ArticleJsonLd article={article} slug={subSlug} site={SITE} />
          {children}
        </>
      );
    }
  }
  return children;
}
