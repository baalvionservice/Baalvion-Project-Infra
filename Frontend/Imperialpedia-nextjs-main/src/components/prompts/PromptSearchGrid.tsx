'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PromptCard } from './PromptCard';
import type { Prompt } from '@/lib/data/prompts-live';

interface Props {
  items: Prompt[];
}

/**
 * Instant client-side filter over the current page's already-loaded prompts (title/category/
 * tags substring match) — not a full-text search against the backend, since there's no search
 * index for prompts yet. Scoped honestly to what's already on the page, same as AuraPrompt's
 * hero search box which filters its visible grid the same way.
 */
export function PromptSearchGrid({ items }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      (p.category ?? '').toLowerCase().includes(q) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [items, query]);

  return (
    <div>
      <div className="mb-10 max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
            placeholder={`Search this page's ${items.length} prompts by name, category, or tag…`}
            aria-label="Search prompts on this page"
            className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-card py-3 pl-11 pr-10 text-sm outline-none ring-primary/30 transition-shadow focus:ring-2"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {query && (
          <p className="mt-2 text-xs text-muted-foreground">
            {filtered.length} of {items.length} prompts on this page match &quot;{query}&quot;
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No prompts on this page match &quot;{query}&quot;.</p>
          <button type="button" onClick={() => setQuery('')} className="mt-3 text-sm font-semibold text-primary hover:underline">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {filtered.map((p, i) => (
            <PromptCard key={p.id} prompt={p} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
