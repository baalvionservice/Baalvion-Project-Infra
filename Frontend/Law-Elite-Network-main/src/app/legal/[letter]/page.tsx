"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { articlesPublicApi } from '@/lib/api/client';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Loader2, ShieldCheck, ArrowLeft, Scale } from 'lucide-react';
import Link from 'next/link';
import seedData from '../../../../docs/seed-data.json';

export default function AlphabeticalListingPage() {
  const { letter } = useParams();
  const normalizedLetter = (letter as string).toUpperCase();

  const [apiArticles, setApiArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Merge law-service articles with CMS-managed articles (added in the
    // admin-platform console) so console publishes appear in the A–Z directly.
    const law = articlesPublicApi
      .list({ alphabet: normalizedLetter, status: 'published', limit: 200 })
      .then((res) => res.data?.data?.items || res.data?.data || [])
      .catch(() => []);
    const cms = fetch(`/api/cms/articles?letter=${normalizedLetter}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (Array.isArray(j?.data) ? j.data : []))
      .catch(() => []);
    Promise.all([law, cms])
      .then(([lawArticles, cmsArticles]) => {
        const bySlug = new Map<string, any>();
        for (const a of [...lawArticles, ...cmsArticles]) {
          if (a && a.slug) bySlug.set(a.slug, a);
        }
        setApiArticles(Array.from(bySlug.values()));
      })
      .finally(() => setLoading(false));
  }, [normalizedLetter]);

  const articles = useMemo(() => {
    if (apiArticles.length > 0) return apiArticles;
    return (seedData as any).articles?.filter((a: any) => a.alphabet === normalizedLetter) || [];
  }, [apiArticles, normalizedLetter]);

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          <nav className="mb-12">
            <Link href="/legal" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to A–Z Index
            </Link>
          </nav>

          <header className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-bold uppercase tracking-[0.2em]">Encyclopedia Index</span>
                  <Scale className="w-4 h-4 text-blue-600" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                  Terms Beginning With <span className="text-blue-600 italic">'{normalizedLetter}'</span>
                </h1>
              </div>
            </div>
          </header>

          {loading && articles.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-12 gap-y-5 px-1">
                {articles.map((art: any) => (
                  <Link
                    key={art.id}
                    href={`/article/${art.slug}`}
                    className="group block transition-all"
                  >
                    <span className="text-[15px] font-medium text-slate-700 group-hover:text-blue-600 group-hover:underline decoration-2 underline-offset-4 transition-all leading-snug block interactive-lift">
                      {art.title}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="mt-32 pt-12 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3 opacity-30">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                    Audit Verified Intelligence • {articles.length} Strategic Dossiers
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-32 text-center opacity-40">
              <p className="text-sm italic font-medium text-slate-400 uppercase tracking-widest">
                Intelligence dossiers for "{normalizedLetter}" are currently being synchronized.
              </p>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
