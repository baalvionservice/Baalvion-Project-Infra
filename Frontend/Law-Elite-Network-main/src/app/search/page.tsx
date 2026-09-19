"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import SearchBar from '@/components/search/SearchBar';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SEARCH_TYPE_META } from '@/lib/search-type-meta';
import type { SearchResultItem, SearchResultType } from '@/lib/global-search';
import {
  Search,
  ShieldCheck,
  SearchX
} from 'lucide-react';
import Link from 'next/link';

type SortOrder = 'relevance' | 'az';

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
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<SearchResultType | 'all'>('all');
  const [sort, setSort] = useState<SortOrder>('relevance');

  useEffect(() => {
    setActiveType('all');
    if (!rawQuery) { setResults([]); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(rawQuery)}&limit=100`)
      .then(res => res.json())
      .then(json => setResults(json?.data?.items || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [rawQuery]);

  const counts = useMemo(() => {
    const map = new Map<SearchResultType, number>();
    results.forEach((r) => map.set(r.type, (map.get(r.type) || 0) + 1));
    return map;
  }, [results]);

  const availableTypes = useMemo(
    () => (Object.keys(SEARCH_TYPE_META) as SearchResultType[]).filter((t) => (counts.get(t) || 0) > 0),
    [counts],
  );

  const visible = useMemo(() => {
    const filtered = activeType === 'all' ? results : results.filter((r) => r.type === activeType);
    if (sort === 'az') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered; // already relevance-sorted server-side
  }, [results, activeType, sort]);

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <header className="mb-16 space-y-12">
            <div className="max-w-3xl mx-auto space-y-6 text-center">
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Search Results
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 font-serif">
                Results for <span className="text-blue-600 italic">"{rawQuery}"</span>
              </h1>
              <div className="pt-4">
                <SearchBar initialValue={rawQuery} variant="navbar" />
              </div>
            </div>
          </header>

          <div className="space-y-8">
            <div className="flex flex-col gap-6 border-b border-slate-100 pb-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-3">
                  <Search className="w-5 h-5 text-blue-600" />
                  {loading ? 'Searching…' : `${visible.length} ${visible.length === 1 ? 'result' : 'results'} found`}
                </h2>

                {!loading && results.length > 0 && (
                  <label className="flex items-center gap-2 text-[12px] font-bold text-slate-500 uppercase tracking-wide">
                    Sort
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOrder)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="az">A–Z</option>
                    </select>
                  </label>
                )}
              </div>

              {!loading && availableTypes.length > 1 && (
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by entity type">
                  <button
                    onClick={() => setActiveType('all')}
                    aria-pressed={activeType === 'all'}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
                      activeType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({results.length})
                  </button>
                  {availableTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveType(t)}
                      aria-pressed={activeType === t}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-tight transition-colors ${
                        activeType === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {SEARCH_TYPE_META[t].label} ({counts.get(t)})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-40 rounded-2xl bg-slate-50 animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : visible.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visible.map((item) => (
                  <SearchResultCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center space-y-8 px-8 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                <SearchX className="w-16 h-16 text-slate-200 mx-auto" />
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-slate-900">No results found</h4>
                  <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We couldn't find anything matching <span className="text-slate-900 font-bold">"{rawQuery}"</span>. Try a different term, or browse People, Entertainment, Legal, or Sports instead.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Link href="/">
                    <button className="bg-slate-900 text-white px-8 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                      Browse Law Elite Network
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
