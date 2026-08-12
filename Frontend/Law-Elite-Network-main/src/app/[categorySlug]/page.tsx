import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { categoriesPublicApi } from '@/lib/api/client';
import { cmsGetArticles } from '@/lib/cms';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { ROOT_FLAT_ARTICLE_SLUGS } from '@/lib/article-url';
import { fetchArticleForRender } from '@/lib/article-fetch';
import { ArticleView } from '@/components/knowledge/ArticleView';
import { ArticleJsonLd } from '@/lib/seo/article-seo';
import seedData from '../../../docs/seed-data.json';
import { CMS_ONLY_CATEGORIES } from '@/lib/cms-only-categories';
import { CategoryContent } from './CategoryContent';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

function bundledCategory(slug: string) {
  if (CMS_ONLY_CATEGORIES[slug]) return CMS_ONLY_CATEGORIES[slug];
  const cat = (seedData as any).categories?.find((c: any) => c.slug === slug);
  if (cat) {
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      descriptionHtml: cat.descriptionHtml,
      pillarTitle: cat.pillarTitle,
    };
  }
  const first = getArticlesByCategorySlug(slug)[0];
  return first ? { ...first.category, description: '' } : null;
}

/**
 * Server-side so the masthead H1 + description are present in the first
 * response — the previous client-only version fetched the category in
 * useEffect, so crawlers only ever saw a loading spinner (no <h1> at all).
 *
 * Local (bundled/CMS-only) fields always merge under the live result rather
 * than being discarded on a live hit: law-service's /categories response has
 * no concept of `descriptionHtml`/`pillarTitle` (the written hub-overview
 * content), so a live category with the same slug would otherwise silently
 * blank out editorial copy that only exists locally -- e.g. tech-ip's.
 */
async function fetchCategory(slug: string): Promise<any | null> {
  const local = bundledCategory(slug);
  try {
    const res = await categoriesPublicApi.get(slug);
    const live = res.data?.data;
    if (!live) return local;
    return local ? { ...local, ...live } : live;
  } catch {
    return local;
  }
}

export default async function CategoryPage(
  { params }: { params: Promise<{ categorySlug: string }> },
) {
  const { categorySlug } = await params;
  const category = await fetchCategory(categorySlug);

  // A handful of standalone guides (see ROOT_FLAT_ARTICLE_SLUGS) are published
  // at a bare root URL instead of the usual /{category}/{slug} shape, so this
  // catch-all segment doubles as their article route -- checked only for the
  // explicit allowlist so an ordinary unknown/mistyped category still 404s
  // without an extra CMS round-trip.
  if (!category && ROOT_FLAT_ARTICLE_SLUGS.has(categorySlug)) {
    const article = await fetchArticleForRender(categorySlug);
    if (article) {
      return (
        <>
          <ArticleJsonLd article={article} slug={categorySlug} site={SITE} />
          <ArticleView article={article} slug={categorySlug} />
        </>
      );
    }
  }

  // Real 404 (not a themed component with an implicit 200) -- this segment is
  // now a top-level catch-all for any unmatched single path segment site-wide,
  // not just paths that already start with /law/, so it must fail closed.
  // src/app/[categorySlug]/not-found.tsx renders the themed empty state.
  if (!category) notFound();

  // CMS-authored articles (admin panel, incl. any uploaded featured image) for this
  // category. CategoryContent previously only queried law-service (empty in production),
  // so these — and their images — never appeared on the practice-area page even though
  // the article detail page rendered them correctly. Fetched here (server) because
  // cms.ts's env vars are server-only, then handed down as a prop.
  const cmsArticles = await cmsGetArticles(undefined, categorySlug).catch(() => []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Lawyers`,
    description: category.description || `Verified ${category.name} lawyers and legal resources.`,
    url: `${SITE}/${categorySlug}`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE}/${categorySlug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <main className="pb-24">
        {/* Category masthead */}
        <section className="border-b border-slate-200 bg-slate-50/60">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
            <Link
              href="/"
              className="flex w-fit items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-slate-400 hover:text-news-600 transition-colors group mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> All Topics
            </Link>
            <span className="kicker">Practice Area</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] mt-3">
              {category.pillarTitle || category.name}
            </h1>
            {category.description && (
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
                {category.description}
              </p>
            )}
          </div>
          {/* Written pillar / "Complete Guide" body for hubs that also serve as a
              standalone article at this same URL (see cms-only-categories.ts). */}
          {category.descriptionHtml && (
            <div className="container mx-auto px-4 sm:px-6 max-w-7xl pb-4">
              <div
                className="prose-legal max-w-3xl"
                dangerouslySetInnerHTML={{ __html: category.descriptionHtml }}
              />
            </div>
          )}
        </section>

        <CategoryContent categorySlug={categorySlug} categoryId={category.id} cmsArticles={cmsArticles} />
      </main>

      <PublicFooter />
    </div>
  );
}
