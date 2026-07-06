"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

  // Bundled content is the trustworthy baseline; live API results take precedence.
  const pool = useMemo(() => mergeArticles(apiArticles), [apiArticles]);

  const trending = useMemo(() => [...pool].sort((a, b) => (b.views || 0) - (a.views || 0)), [pool]);

  const lead = trending[0];
  const heroSecondary = trending.slice(1, 3);
  const latest = trending.slice(3, 9);

  const editorsPicks = useMemo(() => {
    const featured = pool.filter((a) => a.featured);
    const base = featured.length >= 4 ? featured : [...featured, ...trending];
    const seen = new Set<string>();
    return base.filter((a) => (seen.has(a.slug) ? false : (seen.add(a.slug), true))).slice(0, 4);
  }, [pool, trending]);

  const categories = useMemo(() => {
    if (apiCategories.length > 0) {
      return apiCategories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
    }
    return deriveCategories(pool);
  }, [apiCategories, pool]);

  const articlesByCategory = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      articles: pool.filter(
        (a) => categoryIdOf(a) === String(cat.id) || categorySlugOf(a) === cat.slug,
      ),
    }));
  }, [categories, pool]);

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

        {/* Editor's picks */}
        {editorsPicks.length > 0 && (
          <section className="py-8 border-t border-slate-200">
            <div className="flex items-end justify-between border-b-2 border-slate-900 pb-2 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
                <h2 className="font-headline text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 m-0">
                  Editor&rsquo;s Picks
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-9">
              {editorsPicks.map((a) => (
                <StoryCard key={a.id || a.slug} article={a} variant="default" />
              ))}
            </div>
          </section>
        )}

        {/* Category sections */}
        <div className="py-8 border-t border-slate-200">
          {articlesByCategory.map((cat) => (
            <CategorySection key={cat.slug} name={cat.name} slug={cat.slug} articles={cat.articles} />
          ))}
        </div>

        {/* Browse-all CTA */}
        <section className="pb-16">
          <div className="rounded-xl bg-[#0B1F3A] px-6 md:px-10 py-10 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-600">
                Need tailored advice?
              </span>
              <h3 className="font-headline text-2xl md:text-3xl font-extrabold text-white mt-2">
                Connect with a verified lawyer in your jurisdiction.
              </h3>
            </div>
            <Link
              href="/lawyers"
              className="inline-flex items-center justify-center px-7 h-12 rounded-md bg-white text-[#0B1F3A] font-bold text-sm hover:bg-news-600 hover:text-white transition-colors whitespace-nowrap"
            >
              Find a Lawyer
            </Link>
          </div>
        </section>
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
