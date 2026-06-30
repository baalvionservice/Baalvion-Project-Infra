"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { categoriesPublicApi, subcategoriesPublicApi, articlesPublicApi } from '@/lib/api/client';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { getArticlesByCategorySlug } from '@/data/law-content';
import seedData from '../../../../../docs/seed-data.json';
import { Loader2, ChevronRight, FileText } from 'lucide-react';
import Link from 'next/link';

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

export default function SubcategoryPage() {
  const { categorySlug, subSlug } = useParams();
  const catSlug = (categorySlug as string) || '';
  const sub = (subSlug as string) || '';

  const [category, setCategory] = useState<any>(null);
  const [subcategory, setSubcategory] = useState<any>(null);
  const [apiArticles, setApiArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!catSlug || !sub) return;
    setLoading(true);

    const fallbackCat = bundledCategory(catSlug);
    const fallbackSub = bundledSubcategory(catSlug, sub);
    setCategory(fallbackCat);
    setSubcategory(fallbackSub);

    categoriesPublicApi
      .get(catSlug)
      .then((res) => {
        const cat = res.data?.data || fallbackCat;
        setCategory(cat);
        const catId = cat?.id;

        subcategoriesPublicApi
          .list({ categoryId: catId })
          .then((r) => {
            const subs = r.data?.data || [];
            const matched = subs.find((s: any) => s.slug === sub);
            if (matched) setSubcategory(matched);
          })
          .catch(() => {});

        articlesPublicApi
          .list({ categoryId: catId, sortBy: 'views', order: 'desc', status: 'published' })
          .then((r) => setApiArticles(r.data?.data?.items || r.data?.data || []))
          .catch(() => {})
          .finally(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, [catSlug, sub]);

  // Bundled articles are the baseline; API results win (same merge as the category page).
  const articles = useMemo(() => {
    const bundled = getArticlesByCategorySlug(catSlug);
    if (apiArticles.length === 0) return bundled;
    const seen = new Set(apiArticles.map((a) => a.slug));
    return [...apiArticles, ...bundled.filter((a) => !seen.has(a.slug))];
  }, [apiArticles, catSlug]);

  const filteredArticles = useMemo(() => {
    const subId = subcategory?.id ? String(subcategory.id) : null;
    return articles.filter((a) => matchesSubcategory(a, sub, subId));
  }, [articles, sub, subcategory]);

  const categoryName = category?.name || titleCase(catSlug);
  const subName = subcategory?.name || titleCase(sub);

  if (loading && !subcategory) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[96px]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[96px]">
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

          {loading && articles.length === 0 ? (
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
                <h4 className="font-headline text-xl font-bold text-slate-900">No articles yet</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                  We haven&rsquo;t published any {subName.toLowerCase()} guides yet. Explore the rest of{' '}
                  {categoryName} in the meantime.
                </p>
              </div>
              <Link href={`/law/${catSlug}`}>
                <button className="px-7 h-11 rounded-md bg-[#0B1F3A] text-white text-sm font-bold hover:bg-blue-800 transition-colors">
                  Back to {categoryName}
                </button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
