"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { articlesPublicApi } from '@/lib/api/client';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import SearchBar from '@/components/search/SearchBar';
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  FilterX
} from 'lucide-react';
import Link from 'next/link';

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') || "";
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rawQuery) { setArticles([]); return; }
    setLoading(true);
    articlesPublicApi.list({ search: rawQuery, limit: 100, status: 'published' })
      .then(res => setArticles(res.data?.data?.items || res.data?.data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [rawQuery]);

  const results = useMemo(() => {
    if (!articles.length || !rawQuery) return [];
    const q = rawQuery.toLowerCase();

    return articles
      .map(art => {
        let score = 0;
        const title = (art.title || '').toLowerCase();
        const summary = (art.excerpt || art.summary || "").toLowerCase();
        const keywords = (art.tags || art.keywords || []).map((k: string) => k.toLowerCase());

        if (title === q) score += 100;
        else if (title.startsWith(q)) score += 80;
        else if (title.includes(q)) score += 60;

        if (keywords.includes(q)) score += 40;
        else if (keywords.some((k: string) => k.includes(q))) score += 20;

        if (summary.includes(q)) score += 10;
        score += (art.views || 0) / 1000;

        return { ...art, score };
      })
      .filter(art => art.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [articles, rawQuery]);

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <header className="mb-20 space-y-12">
            <div className="max-w-3xl mx-auto space-y-6 text-center">
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Network Discovery Protocol
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 font-serif">
                Intelligence Audit: <span className="text-blue-600 italic">"{rawQuery}"</span>
              </h1>
              <div className="pt-4">
                <SearchBar initialValue={rawQuery} variant="navbar" />
              </div>
            </div>
          </header>

          <div className="space-y-12">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                {results.length} Intelligence Matches Identified
              </h2>
              <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Rank Optimized
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 rounded-[2.5rem] bg-slate-50 animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {results.map((art) => (
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center space-y-8 px-8 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                <div className="relative inline-block">
                  <FilterX className="w-16 h-16 text-slate-200 mx-auto" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-slate-900">Intelligence Not Located</h4>
                  <p className="text-slate-500 italic max-w-sm mx-auto leading-relaxed">
                    Platform intelligence could not locate dossiers matching <span className="text-slate-900 font-bold">"{rawQuery}"</span>. Try refining your search parameters or explore trending domains.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Link href="/legal">
                    <button className="bg-slate-900 text-white px-8 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                      Browse A–Z Index
                    </button>
                  </Link>
                  <Link href="/">
                    <button className="bg-white border border-slate-200 text-slate-600 px-8 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                      Return to Discovery
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-white pt-32 px-6">
      <div className="container mx-auto max-w-7xl animate-pulse space-y-12">
        <div className="h-4 w-32 bg-slate-50 mx-auto rounded-full" />
        <div className="h-16 w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl" />
        <div className="h-64 grid grid-cols-3 gap-8">
           <div className="bg-slate-50 rounded-3xl" />
           <div className="bg-slate-50 rounded-3xl" />
           <div className="bg-slate-50 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
