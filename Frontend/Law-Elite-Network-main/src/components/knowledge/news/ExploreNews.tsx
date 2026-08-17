"use client";

import React, { useMemo, useState } from 'react';
import { StoryCard } from './StoryCard';

interface ExploreNewsProps {
  articles: any[];
}

/**
 * Single filterable news grid: an "All" + per-category tab bar over a 4-up
 * card grid, replacing what used to be one separate hand-rolled section per
 * category (same articles, same cards -- just one browsable surface instead
 * of six stacked ones).
 */
export function ExploreNews({ articles }: ExploreNewsProps) {
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of articles) {
      const slug = a?.category?.slug;
      const name = a?.category?.name;
      if (slug && name && !seen.has(slug)) seen.set(slug, name);
    }
    return [...seen.entries()].map(([slug, name]) => ({ slug, name }));
  }, [articles]);

  const [active, setActive] = useState<string>('all');

  const filtered = useMemo(() => {
    if (active === 'all') return articles;
    return articles.filter((a) => a?.category?.slug === active);
  }, [articles, active]);

  if (articles.length === 0) return null;

  return (
    <section>
      <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-2 mb-8">
        <span className="w-1.5 h-6 bg-news-600 rounded-sm inline-block mr-3 align-middle" />
        <h2 className="font-headline text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white inline align-middle m-0">
          Explore News
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter news by category">
        <button
          type="button"
          role="tab"
          aria-selected={active === 'all'}
          onClick={() => setActive('all')}
          className={`px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-full border transition-colors ${
            active === 'all'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
              : 'bg-transparent text-slate-500 border-slate-200 hover:border-slate-400 dark:text-slate-400 dark:border-slate-700'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={active === c.slug}
            onClick={() => setActive(c.slug)}
            className={`px-4 py-2 text-[12px] font-bold uppercase tracking-wider rounded-full border transition-colors ${
              active === c.slug
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'bg-transparent text-slate-500 border-slate-200 hover:border-slate-400 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-10">
        {filtered.map((article) => (
          <StoryCard key={article.id || article.slug} article={article} variant="default" />
        ))}
      </div>
    </section>
  );
}
