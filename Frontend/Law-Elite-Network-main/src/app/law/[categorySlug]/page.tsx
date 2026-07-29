import React from 'react';
import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';
import { categoriesPublicApi } from '@/lib/api/client';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getArticlesByCategorySlug } from '@/data/law-content';
import seedData from '../../../../docs/seed-data.json';
import { CategoryContent } from './CategoryContent';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

function bundledCategory(slug: string) {
  const cat = (seedData as any).categories?.find((c: any) => c.slug === slug);
  if (cat) return { id: cat.id, name: cat.name, slug: cat.slug, description: cat.description };
  const first = getArticlesByCategorySlug(slug)[0];
  return first ? { ...first.category, description: '' } : null;
}

/**
 * Server-side so the masthead H1 + description are present in the first
 * response — the previous client-only version fetched the category in
 * useEffect, so crawlers only ever saw a loading spinner (no <h1> at all).
 */
async function fetchCategory(slug: string): Promise<any | null> {
  try {
    const res = await categoriesPublicApi.get(slug);
    return res.data?.data || bundledCategory(slug);
  } catch {
    return bundledCategory(slug);
  }
}

export default async function CategoryPage(
  { params }: { params: Promise<{ categorySlug: string }> },
) {
  const { categorySlug } = await params;
  const category = await fetchCategory(categorySlug);

  if (!category) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center pt-[96px]">
        <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
          <SearchX className="w-10 h-10" />
        </div>
        <h2 className="font-headline text-3xl font-extrabold text-slate-900 mb-3">Topic not found</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
          We couldn&rsquo;t find this practice area. It may have moved or been renamed.
        </p>
        <Link href="/">
          <button className="bg-[#0B1F3A] text-white px-8 h-12 rounded-md font-bold text-sm hover:bg-blue-800 transition-colors">
            Back to Home
          </button>
        </Link>
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Lawyers`,
    description: category.description || `Verified ${category.name} lawyers and legal resources.`,
    url: `${SITE}/law/${categorySlug}`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE}/law/${categorySlug}` },
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
              className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-slate-400 hover:text-news-600 transition-colors group mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> All Topics
            </Link>
            <span className="kicker">Practice Area</span>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.02] mt-3">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed mt-4">
                {category.description}
              </p>
            )}
          </div>
        </section>

        <CategoryContent categorySlug={categorySlug} categoryId={category.id} />
      </main>

      <PublicFooter />
    </div>
  );
}
