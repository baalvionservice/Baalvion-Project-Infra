'use client';

import { useState } from 'react';
import { SearchDialog } from '@/components/docs/search-dialog';

export function HomeHeroSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring mx-auto flex w-full max-w-xl items-center gap-3 rounded-xl border border-line-strong bg-surface px-5 py-4 text-left text-muted shadow-sm transition hover:border-accent/40"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5 shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
        </svg>
        <span className="flex-1 text-sm sm:text-base">Search articles, guides, and API reference…</span>
        <kbd className="kbd hidden sm:inline-flex">⌘K</kbd>
      </button>
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
