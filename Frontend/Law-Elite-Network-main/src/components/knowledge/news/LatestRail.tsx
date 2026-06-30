"use client";

import React from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';

interface LatestRailProps {
  articles: any[];
  title?: string;
}

/**
 * CNBC-style "Latest" column: a tight, text-first stack of recent headlines
 * with category kickers and read-time. Sits beside the lead story.
 */
export function LatestRail({ articles, title = 'Latest Guides' }: LatestRailProps) {
  if (!articles || articles.length === 0) return null;

  return (
    <aside className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 bg-[#0B1F3A] px-4 py-3">
        <span className="w-2 h-2 rounded-full bg-news-600 animate-pulse" />
        <h2 className="font-headline text-sm font-extrabold uppercase tracking-[0.16em] text-white m-0">
          {title}
        </h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {articles.map((art) => (
          <li key={art.id || art.slug}>
            <Link href={`/article/${art.slug}`} className="group block px-4 py-3.5 hover:bg-slate-50 transition-colors">
              {art.category?.name && (
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-news-600 mb-1">
                  {art.category.name}
                </span>
              )}
              <h3 className="font-headline text-[15px] font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors line-clamp-2">
                {art.title}
              </h3>
              {art.readingTime ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Clock className="w-3 h-3" /> {art.readingTime} min read
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
