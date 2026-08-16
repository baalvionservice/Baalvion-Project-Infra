"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StoryCard } from './StoryCard';
import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';

interface CategorySectionProps {
  name: string;
  slug: string;
  articles: any[];
}

/**
 * A homepage/news section for one practice area: a CNBC-style ruled header
 * (heavy black underline + red accent + "view all") over a responsive row of
 * cards.
 */
export function CategorySection({ name, slug, articles }: CategorySectionProps) {
  if (!articles || articles.length === 0) return null;
  const cards = articles.slice(0, 3);
  // `slug` is a raw CMS category slug -- callers group articles by whatever
  // string is in article.category.slug, which isn't guaranteed to be one of
  // the site's 8 real category pages (e.g. a narrow CMS category like
  // `criminal-law-dui-defense`, or `legal-guides`, which has no route at
  // all). Only render "View all" when it actually resolves to something.
  const hasRealCategoryPage = (CURRENT_CATEGORY_SLUGS as readonly string[]).includes(slug);

  return (
    <section className="mb-14">
      <div className="flex items-end justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-2 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
          <h2 className="font-headline text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
            {name}
          </h2>
        </div>
        {hasRealCategoryPage && (
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 hover:text-news-600 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-9">
        {cards.map((article) => (
          <StoryCard key={article.id || article.slug} article={article} variant="default" />
        ))}
      </div>
    </section>
  );
}
