"use client";

import React from 'react';
import Link from 'next/link';

interface TopicTickerProps {
  categories: any[];
}

/**
 * Slim, horizontally-scrollable strip of practice areas — the editorial
 * analogue of CNBC's markets ticker. Gives instant scent of breadth.
 */
export function TopicTicker({ categories }: TopicTickerProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="border-y border-slate-200 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2.5">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-news-600 pr-3 mr-1 border-r border-slate-300">
            Practice Areas
          </span>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/law/${cat.slug}`}
              className="shrink-0 px-3 py-1 text-[13px] font-semibold text-slate-600 hover:text-news-600 whitespace-nowrap transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
