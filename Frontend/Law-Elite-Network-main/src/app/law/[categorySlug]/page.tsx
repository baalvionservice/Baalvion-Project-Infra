"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { categoriesPublicApi, subcategoriesPublicApi, articlesPublicApi } from '@/lib/api/client';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { SubcategoryTabs } from '@/components/knowledge/SubcategoryTabs';
import { AlphabetFilter } from '@/components/knowledge/AlphabetFilter';
import { getArticlesByCategorySlug } from '@/data/law-content';
import seedData from '../../../../docs/seed-data.json';
import { Loader2, ArrowLeft, SearchX, FileText } from 'lucide-react';
import Link from 'next/link';

function bundledCategory(slug: string) {
  const cat = (seedData as any).categories?.find((c: any) => c.slug === slug);
  if (cat) return { id: cat.id, name: cat.name, slug: cat.slug, description: cat.description };
  const first = getArticlesByCategorySlug(slug)[0];
  return first ? { ...first.category, description: '' } : null;
}

function bundledSubcategories(categoryId: string) {
  return ((seedData as any).subcategories || []).filter(
    (s: any) => String(s.categoryId) === String(categoryId),
  );
}

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const searchParams = useSearchParams();
  const slug = (categorySlug as string) || '';

  const [category, setCategory] = useState<any>(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [apiArticles, setApiArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedAlphabet, setSelectedAlphabet] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setCategoryLoading(true);
    setArticlesLoading(true);

    const fallbackCat = bundledCategory(slug);

    categoriesPublicApi
      .get(slug)
      .then((res) => {
        const cat = res.data?.data || fallbackCat;
        setCategory(cat);
        const catId = cat?.id;

        subcategoriesPublicApi
          .list({ categoryId: catId })
          .then((r) => {
            const subs = r.data?.data || [];
            setSubcategories(subs.length > 0 ? subs : bundledSubcategories(catId));
          })
          .catch(() => setSubcategories(bundledSubcategories(catId)));

        articlesPublicApi
          .list({ categoryId: catId, sortBy: 'views', order: 'desc', status: 'published' })
          .then((r) => setApiArticles(r.data?.data?.items || r.data?.data || []))
          .catch(() => {})
          .finally(() => setArticlesLoading(false));
      })
      .catch(() => {
        setCategory(fallbackCat);
        setSubcategories(fallbackCat ? bundledSubcategories(fallbackCat.id) : []);
        setArticlesLoading(false);
      })
      .finally(() => setCategoryLoading(false));
  }, [slug]);

  // Preselect a subcategory from the ?sub= deep link once subcategories load.
  useEffect(() => {
    const sub = searchParams.get('sub');
    if (!sub || subcategories.length === 0) return;
    const match = subcategories.find((s) => s.slug === sub);
    if (match) setSelectedSubcategoryId(String(match.id));
  }, [searchParams, subcategories]);

  // Bundled articles for this category are the baseline; API results win.
  const articles = useMemo(() => {
    const bundled = getArticlesByCategorySlug(slug);
    if (apiArticles.length === 0) return bundled;
    const seen = new Set(apiArticles.map((a) => a.slug));
    return [...apiArticles, ...bundled.filter((a) => !seen.has(a.slug))];
  }, [apiArticles, slug]);

  const filteredArticles = useMemo(() => {
    let results = [...articles];
    if (selectedSubcategoryId) {
      results = results.filter(
        (a) =>
          String(a.subcategory_id || a.subcategoryId || a.subcategory?.id) ===
          String(selectedSubcategoryId),
      );
    }
    if (selectedAlphabet) {
      results = results.filter(
        (a) => (a.alphabet || a.title?.[0]?.toUpperCase()) === selectedAlphabet,
      );
    }
    return results;
  }, [articles, selectedSubcategoryId, selectedAlphabet]);

  if (categoryLoading && !category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[96px]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-30" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
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

        {/* Filters */}
        <div className="sticky top-[60px] lg:top-[96px] z-30 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Filter by topic
              </span>
              <SubcategoryTabs
                subcategories={subcategories}
                selectedId={selectedSubcategoryId}
                onSelect={setSelectedSubcategoryId}
              />
            </div>
            <div className="flex flex-col gap-2 lg:items-end">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">A–Z</span>
              <AlphabetFilter selected={selectedAlphabet} onSelect={setSelectedAlphabet} />
            </div>
          </div>
        </div>

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

          {articlesLoading && articles.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[16/10] rounded-lg bg-slate-100 animate-pulse" />
                  <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-slate-50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id || article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center space-y-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1.5">
                <h4 className="font-headline text-xl font-bold text-slate-900">No articles match your filters</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Try clearing the topic or A–Z filters to see everything in this practice area.
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSubcategoryId(null);
                  setSelectedAlphabet(null);
                }}
                className="px-7 h-11 rounded-md bg-[#0B1F3A] text-white text-sm font-bold hover:bg-blue-800 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
