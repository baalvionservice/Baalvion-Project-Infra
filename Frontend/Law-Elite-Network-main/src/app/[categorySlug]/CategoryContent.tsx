"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { articlesPublicApi } from '@/lib/api/client';
import { ArticleCard } from '@/components/knowledge/ArticleCard';
import { getArticlesByCategorySlug } from '@/data/law-content';
import { FileText } from 'lucide-react';

interface CategoryContentProps {
  categorySlug: string;
  categoryId: string;
  /** CMS-authored articles for this category, fetched server-side by the parent page (see [categorySlug]/page.tsx). */
  cmsArticles?: any[];
  /** Slugs already shown in the page's lead+rail spotlight above this grid — excluded here so the same guide never appears twice on one page. */
  excludeSlugs?: string[];
}

/**
 * Article grid for a practice-area page. The masthead (H1, description) is
 * rendered server-side by the parent page — this piece stays client-only
 * because it merges in the live law-service article list on mount.
 */
export function CategoryContent({ categorySlug, categoryId, cmsArticles = [], excludeSlugs = [] }: CategoryContentProps) {
  const [apiArticles, setApiArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    articlesPublicApi
      .list({ categoryId, sortBy: 'views', order: 'desc', status: 'published' })
      .then((r) => setApiArticles(r.data?.data?.items || r.data?.data || []))
      .catch(() => {})
      .finally(() => setArticlesLoading(false));
  }, [categoryId]);

  // Bundled articles for this category are the baseline; CMS (admin-authored, incl.
  // uploaded featured images) wins on a slug collision, then law-service results.
  const articles = useMemo(() => {
    const bundled = getArticlesByCategorySlug(categorySlug);
    const seen = new Set<string>();
    const exclude = new Set(excludeSlugs);
    const combined = [...cmsArticles, ...apiArticles, ...bundled].filter((a) => {
      if (!a?.slug || seen.has(a.slug) || exclude.has(a.slug)) return false;
      seen.add(a.slug);
      return true;
    });
    return combined;
  }, [cmsArticles, apiArticles, categorySlug, excludeSlugs]);

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-10">
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
          <h2 className="font-headline text-xl md:text-2xl font-extrabold text-slate-900 m-0">
            Guides &amp; Explainers
          </h2>
        </div>
        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
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
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
          {articles.map((article) => (
            <ArticleCard key={article.id || article.slug} article={article} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-5 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1.5">
            <h4 className="font-headline text-xl font-bold text-slate-900">No articles yet</h4>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Guides for this practice area are being added.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
