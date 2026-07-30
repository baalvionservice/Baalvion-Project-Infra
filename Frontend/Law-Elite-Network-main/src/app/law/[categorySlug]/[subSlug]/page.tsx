import React from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { categoriesPublicApi, subcategoriesPublicApi, articlesPublicApi } from '@/lib/api/client';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { ArticleView, ArticleNotFound } from '@/components/knowledge/ArticleView';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { articleUrl } from '@/lib/article-url';
import { isKnownSubcategory } from '@/lib/subcategory-or-article';
import seedData from '../../../../../docs/seed-data.json';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function bundledCategory(slug: string) {
  const cat = (seedData as any).categories?.find((c: any) => c.slug === slug);
  if (cat) return { id: cat.id, name: cat.name, slug: cat.slug };
  const first = getArticlesByCategorySlug(slug)[0];
  return first ? first.category : null;
}

function bundledSubcategory(categorySlug: string, subSlug: string) {
  const sub = ((seedData as any).subcategories || []).find((s: any) => s.slug === subSlug);
  if (sub) return { id: sub.id, name: sub.name, slug: sub.slug };
  const match = getArticlesByCategorySlug(categorySlug).find((a) => a.subcategory.slug === subSlug);
  return match ? match.subcategory : null;
}

/** True when an article belongs to the given subcategory, by slug or by id (API shape). */
function matchesSubcategory(article: any, subSlug: string, subId: string | null): boolean {
  if (article?.subcategory?.slug && article.subcategory.slug === subSlug) return true;
  if (!subId) return false;
  return (
    String(article?.subcategory_id || article?.subcategoryId || article?.subcategory?.id) === String(subId)
  );
}

/**
 * Server-side so the masthead H1 and article grid are present in the first
 * response. There's no client interactivity on this page (no filters, just
 * links) — the previous client-only version fetched everything in useEffect,
 * so crawlers only ever saw a loading spinner.
 */
async function fetchTaxonomyAndArticles(catSlug: string, sub: string) {
  const fallbackCat = bundledCategory(catSlug);
  const fallbackSub = bundledSubcategory(catSlug, sub);

  let category = fallbackCat;
  let subcategory = fallbackSub;
  let apiArticles: any[] = [];

  try {
    const catRes = await categoriesPublicApi.get(catSlug);
    category = catRes.data?.data || fallbackCat;
    const catId = category?.id;

    const [subsRes, articlesRes] = await Promise.all([
      subcategoriesPublicApi.list({ categoryId: catId }).catch(() => null),
      articlesPublicApi
        .list({ categoryId: catId, sortBy: 'views', order: 'desc', status: 'published' })
        .catch(() => null),
    ]);

    const subs = subsRes?.data?.data || [];
    const matched = subs.find((s: any) => s.slug === sub);
    if (matched) subcategory = matched;

    apiArticles = articlesRes?.data?.data?.items || articlesRes?.data?.data || [];
  } catch {
    /* keep bundled fallbacks */
  }

  return { category, subcategory, apiArticles };
}

export default async function SubcategoryPage(
  { params, searchParams }: {
    params: Promise<{ categorySlug: string; subSlug: string }>;
    searchParams: Promise<{ previewToken?: string; previewExp?: string }>;
  },
) {
  const { categorySlug: catSlug, subSlug: sub } = await params;

  // This segment is ambiguous: a real subcategory hub, OR a 2-segment CMS
  // article URL (CMS content has no subcategory -- see article-url.ts /
  // lib/subcategory-or-article.ts). Try the article path first.
  if (!(await isKnownSubcategory(catSlug, sub))) {
    const { previewToken, previewExp } = await searchParams;
    const isPreview = Boolean(previewToken && previewExp);
    const article = await fetchArticleForRender(sub, previewToken, previewExp);

    if (article) {
      if (!isPreview) {
        const canonicalPath = articleUrl(article);
        const requestedPath = `/law/${catSlug}/${sub}`;
        if (canonicalPath !== requestedPath) {
          permanentRedirect(canonicalPath);
        }
      }
      return <ArticleView article={article} slug={sub} />;
    }

    return <ArticleNotFound />;
  }

  const { category, subcategory, apiArticles } = await fetchTaxonomyAndArticles(catSlug, sub);

  // Bundled articles are the baseline; API results win (same merge as the category page).
  const articles = (() => {
    const bundled = getArticlesByCategorySlug(catSlug);
    if (apiArticles.length === 0) return bundled;
    const seen = new Set(apiArticles.map((a) => a.slug));
    return [...apiArticles, ...bundled.filter((a) => !seen.has(a.slug))];
  })();

  const subId = subcategory?.id ? String(subcategory.id) : null;
  const filteredArticles = articles.filter((a) => matchesSubcategory(a, sub, subId));

  // A real subcategory with zero articles is a dead end, not a page worth serving --
  // it's already hidden from nav (see docs/empty-subcategories.md) and noindexed
  // (layout.tsx), so a genuine 404 here matches what both already communicate.
  if (filteredArticles.length === 0) {
    notFound();
  }

  const categoryName = category?.name || titleCase(catSlug);
  const subName = subcategory?.name || titleCase(sub);
  const url = `${SITE}/law/${catSlug}/${sub}`;

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
      { '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE}/law/${catSlug}` },
      { '@type': 'ListItem', position: 3, name: subName, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="pb-24">
        {/* Subcategory masthead with breadcrumb */}
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center flex-wrap gap-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-6"
            >
              <Link href="/" className="hover:text-news-600 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Link href={`/law/${catSlug}`} className="hover:text-news-600 transition-colors">
                {categoryName}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-600">{subName}</span>
            </nav>
            <span className="kicker">{categoryName}</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] mt-3">
              {subName}
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
              Expert {subName.toLowerCase()} guides within {categoryName.toLowerCase()} law — clear, worldwide
              explainers written for a general audience.
            </p>
          </div>
        </section>

        {/* Articles */}
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
              <h2 className="font-headline text-xl md:text-2xl font-extrabold text-slate-900 m-0">
                Guides &amp; Explainers
              </h2>
            </div>
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.id || article.slug} article={article} />
            ))}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
