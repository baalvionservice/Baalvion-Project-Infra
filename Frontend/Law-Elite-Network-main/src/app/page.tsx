"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { categoriesPublicApi, articlesPublicApi } from '@/lib/api/client';
import { mergeArticles } from '@/data/law-content';
import { TopicTicker } from '@/components/knowledge/news/TopicTicker';
import { StoryCard } from '@/components/knowledge/news/StoryCard';
import { LatestRail } from '@/components/knowledge/news/LatestRail';
import { CategorySection } from '@/components/knowledge/news/CategorySection';
import { TrustSection } from '@/components/knowledge/TrustSection';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import SearchBar from '@/components/search/SearchBar';
import { ShieldCheck } from 'lucide-react';

function categoryIdOf(a: any): string {
  return String(a?.categoryId ?? a?.category?.id ?? a?.category_id ?? '');
}
function categorySlugOf(a: any): string {
  return String(a?.category?.slug ?? a?.categorySlug ?? '');
}

function deriveCategories(pool: any[]): { id: string; name: string; slug: string }[] {
  const map = new Map<string, { id: string; name: string; slug: string }>();
  pool.forEach((a) => {
    const c = a?.category;
    if (c?.slug && c?.name && !map.has(c.slug)) {
      map.set(c.slug, { id: c.id, name: c.name, slug: c.slug });
    }
  });
  return [...map.values()];
}

export default function KnowledgeHomePage() {
  const [apiCategories, setApiCategories] = useState<any[]>([]);
  const [apiArticles, setApiArticles] = useState<any[]>([]);

  useEffect(() => {
    categoriesPublicApi
      .list()
      .then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) setApiCategories(data);
      })
      .catch(() => {});

    articlesPublicApi
      .list({ sortBy: 'views', order: 'desc', limit: 50, status: 'published' })
      .then((res) => {
        const items = res.data?.data?.items || res.data?.data || [];
        if (Array.isArray(items)) setApiArticles(items);
      })
      .catch(() => {});
  }, []);

  const pool = useMemo(() => mergeArticles(apiArticles), [apiArticles]);

  const trending = useMemo(() => [...pool].sort((a, b) => (b.views || 0) - (a.views || 0)), [pool]);

  const lead = trending[0];
  const heroSecondary = trending.slice(1, 3);
  const latest = trending.slice(3, 7);

  const usedSlugs = useMemo(() => {
    const seen = new Set<string>();
    if (lead) seen.add(lead.slug);
    heroSecondary.forEach((a) => seen.add(a.slug));
    latest.forEach((a) => seen.add(a.slug));
    return seen;
  }, [lead, heroSecondary, latest]);

  const categories = useMemo(() => {
    if (apiCategories.length > 0) {
      return apiCategories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
    }
    return deriveCategories(pool);
  }, [apiCategories, pool]);

  const articlesByCategory = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      articles: pool
        .filter((a) => !usedSlugs.has(a.slug))
        .filter(
          (a) => categoryIdOf(a) === String(cat.id) || categorySlugOf(a) === cat.slug,
        )
        .slice(0, 3),
    }));
  }, [categories, pool, usedSlugs]);

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
      {/* Masthead strip */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-8 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <span className="kicker">
              <ShieldCheck className="w-3.5 h-3.5" /> Trusted Legal Knowledge · Worldwide
            </span>
            <h1 className="font-headline text-3xl md:text-[2.6rem] font-extrabold tracking-tight text-slate-900 leading-[1.05] mt-2">
              Plain-language guides to the law,
              <br className="hidden md:block" /> for every jurisdiction.
            </h1>
          </div>
          <div className="w-full lg:max-w-md">
            <SearchBar variant="navbar" />
          </div>
        </div>
      </section>

      <TopicTicker categories={categories} />

      <main className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Hero: lead + secondary + latest rail */}
        <section className="py-8 md:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-8 space-y-9">
              {lead && <StoryCard article={lead} variant="lead" priority />}
              {heroSecondary.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 pt-2 border-t border-slate-100">
                  {heroSecondary.map((a) => (
                    <StoryCard key={a.id || a.slug} article={a} variant="default" />
                  ))}
                </div>
              )}
            </div>
            <div className="lg:col-span-4">
              <LatestRail articles={latest} />
            </div>
          </div>
        </section>

        {/* Category sections */}
        <div className="py-8 border-t border-slate-200">
          {articlesByCategory.map((cat) => (
            <CategorySection key={cat.slug} name={cat.name} slug={cat.slug} articles={cat.articles} />
          ))}
        </div>

      </main>

      <section className="border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-12">
          <TrustSection />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
// Force rebuild at Mon Aug  3 00:52:42 IST 2026
// Deploy timestamp: Mon Aug  3 01:25:18 IST 2026
