"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StoryCard } from './StoryCard';

interface CategorySectionProps {
  name: string;
  slug: string;
  articles: any[];
}

/**
 * A homepage section for one practice area: a CNBC-style ruled header (heavy
 * black underline + red accent + "view all") over a responsive row of cards.
 */
export function CategorySection({ name, slug, articles }: CategorySectionProps) {
  if (!articles || articles.length === 0) return null;
  const cards = articles.slice(0, 4);

  return (
    <section className="mb-14">
      <div className="flex items-end justify-between border-b-2 border-slate-900 pb-2 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
          <h2 className="font-headline text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 m-0">
            {name}
          </h2>
        </div>
        <Link
          href={`/law/${slug}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-700 hover:text-news-600 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-9">
        {cards.map((article) => (
          <StoryCard key={article.id || article.slug} article={article} variant="default" />
        ))}
      </div>
    </section>
  );
}
