"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { categoriesPublicApi, subcategoriesPublicApi, articlesPublicApi } from '@/lib/api/client';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { SubcategoryTabs } from '@/components/knowledge/SubcategoryTabs';
import { AlphabetFilter } from '@/components/knowledge/AlphabetFilter';
import { Loader2, Info, ShieldCheck, ArrowLeft, SearchX, Zap } from 'lucide-react';
import Link from 'next/link';

export default function CategoryDossierPage() {
  const { categorySlug } = useParams();

  const [category, setCategory] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedAlphabet, setSelectedAlphabet] = useState<string | null>(null);

  useEffect(() => {
    if (!categorySlug) return;
    setCategoryLoading(true);
    categoriesPublicApi.get(categorySlug as string)
      .then(res => {
        const cat = res.data?.data;
        setCategory(cat);
        if (cat?.id) {
          subcategoriesPublicApi.list({ categoryId: cat.id })
            .then(r => setSubcategories(r.data?.data || []))
            .catch(() => {});

          setArticlesLoading(true);
          articlesPublicApi.list({ categoryId: cat.id, sortBy: 'views', order: 'desc', status: 'published' })
            .then(r => setArticles(r.data?.data?.items || r.data?.data || []))
            .catch(() => {})
            .finally(() => setArticlesLoading(false));
        }
      })
      .catch(() => setCategory(null))
      .finally(() => setCategoryLoading(false));
  }, [categorySlug]);

  const filteredArticles = useMemo(() => {
    let results = [...articles];
    if (selectedSubcategoryId) {
      results = results.filter(a => String(a.subcategory_id || a.subcategoryId) === String(selectedSubcategoryId));
    }
    if (selectedAlphabet) {
      results = results.filter(a => a.alphabet === selectedAlphabet);
    }
    return results;
  }, [articles, selectedSubcategoryId, selectedAlphabet]);

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-20" />
          <Zap className="w-5 h-5 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-inner">
          <SearchX className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4 font-serif italic">Jurisdiction Not Located</h2>
        <p className="text-slate-500 italic mb-12 max-w-sm mx-auto leading-relaxed">
          The requested legal domain could not be synchronized with our active network mapping.
        </p>
        <Link href="/">
          <button className="bg-slate-900 text-white px-10 h-14 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all interactive-lift">
            Return to Discovery Hub
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-24 pb-32">
        <section className="border-b border-slate-100 bg-slate-50/30 py-24 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -mr-64 -mt-64" />

          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors group mb-10">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Global Discovery
            </Link>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold uppercase tracking-[0.2em]">Verified Domain Cluster</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter font-serif italic leading-none">{category.name}</h1>
              <p className="text-xl md:text-2xl text-slate-500 font-medium italic max-w-2xl leading-relaxed">
                {category.description}
              </p>
            </div>
          </div>
        </section>

        <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 mb-16 shadow-sm">
          <div className="container mx-auto px-6 max-w-7xl py-6 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter by Specialization:</span>
              <SubcategoryTabs
                subcategories={subcategories}
                selectedId={selectedSubcategoryId}
                onSelect={setSelectedSubcategoryId}
              />
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lexicon Audit:</span>
              <AlphabetFilter
                selected={selectedAlphabet}
                onSelect={setSelectedAlphabet}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 max-w-7xl">
          <section className="space-y-16">
            <div className="flex items-center justify-between border-b border-slate-100 pb-8">
              <h2 className="text-3xl font-bold text-slate-900 font-serif italic">Intelligence Ledger</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                  {filteredArticles.length} Strategic Dossiers
                </span>
              </div>
            </div>

            {articlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-72 rounded-[2.5rem] bg-slate-50 animate-pulse border border-slate-100" />
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-in fade-in duration-700">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="py-40 text-center space-y-8 px-8 border-2 border-dashed border-slate-100 rounded-[4rem] bg-slate-50/30 animate-in zoom-in duration-500">
                <div className="relative inline-block">
                  <Info className="w-16 h-16 text-slate-200 mx-auto" />
                  <Zap className="w-6 h-6 text-blue-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-bold text-slate-900 font-serif italic">Audit Ledger Empty</h4>
                  <p className="text-base text-slate-500 italic max-w-xs mx-auto leading-relaxed">
                    Our intelligence protocol could not locate dossiers matching your discovery parameters.
                  </p>
                </div>
                <div className="pt-6">
                  <button
                    onClick={() => { setSelectedSubcategoryId(null); setSelectedAlphabet(null); }}
                    className="px-10 h-14 rounded-2xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl interactive-lift"
                  >
                    Reset Discovery Filters
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
