import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SEARCH_TYPE_META } from '@/lib/search-type-meta';
import type { SearchResultItem } from '@/lib/global-search';

/** One card shape for every pillar's search result -- type badge + title + subtitle, so a Person, a Case, and an Article never look interchangeable in results. */
export function SearchResultCard({ item }: { item: SearchResultItem }) {
  const meta = SEARCH_TYPE_META[item.type];
  const Icon = meta.icon;
  return (
    <Link
      href={item.url}
      className="group flex flex-col h-full p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)] transition-all bg-white"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 rounded-full px-2.5 py-1">
          <Icon className="w-3 h-3" /> {meta.label}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="font-headline text-base font-bold text-slate-900 group-hover:text-news-600 transition-colors leading-snug line-clamp-2">
        {item.title}
      </h3>
      {item.subtitle && (
        <p className="mt-2 text-[13px] text-slate-500 font-medium">{item.subtitle}</p>
      )}
    </Link>
  );
}
