"use client";

import React from 'react';
import Link from 'next/link';
import { articleUrl } from '@/lib/article-url';

interface LatestRailProps {
  articles: any[];
  title?: string;
}

/**
 * CNBC-style "Latest" column: a tight, text-first stack of recent headlines
 * with category kickers. Sits beside the lead story.
 */
export function LatestRail({ articles, title = 'Essential Reads' }: LatestRailProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <aside className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 bg-[#0B1F3A] dark:bg-slate-950 px-4 py-3">
        <span className="w-2 h-2 rounded-full bg-news-600 animate-pulse" />
        <h2 className="font-headline text-sm font-extrabold uppercase tracking-[0.16em] text-white m-0">
          {title}
        </h2>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 dark:bg-slate-900">
        {articles.map((art) => (
          <li key={art.id || art.slug}>
            <Link href={articleUrl(art)} className="group block px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              {art.category?.name && (
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-news-600 mb-1">
                  {art.category.name}
                </span>
              )}
              <h3 className="font-headline text-[15px] font-bold leading-snug text-slate-900 dark:text-white group-hover:text-news-600 transition-colors line-clamp-2">
                {art.title}
              </h3>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
