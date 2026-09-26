'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { PromptGridCard } from './PromptGridCard';
import { categoryLabel } from '@/config/prompt-categories';
import type { FlatPromptCard } from '@/lib/data/prompts-live';

interface Props {
  cards: FlatPromptCard[];
  /** Copy for the empty/no-results state — differs between /trending-prompts and a category page. */
  emptyMessage?: string;
}

/**
 * Google-style search: one large centered pill, nothing else competing for attention above the
 * results. Filters the already-loaded flat prompt cards client-side (heading, subtitle, prompt
 * text, and category) — same "search what's already on the page" honesty as PromptSearchGrid,
 * just built for the one-card-per-prompt grid /trending-prompts and category pages use instead
 * of the one-card-per-post grid on /prompts.
 */
export function PromptGridSearch({ cards, emptyMessage }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) => {
      const { item, postCategory } = card;
      return (
        item.heading.toLowerCase().includes(q) ||
        (item.subtitle ?? '').toLowerCase().includes(q) ||
        item.prompt_text.toLowerCase().includes(q) ||
        (postCategory ?? '').toLowerCase().includes(q) ||
        (postCategory ? categoryLabel(postCategory).toLowerCase().includes(q) : false)
      );
    });
  }, [cards, query]);

  return (
    <div>
      <div className="mx-auto mb-10 max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setQuery(''); }}
            placeholder={`Search ${cards.length} prompt${cards.length === 1 ? '' : 's'} by name, category, or style…`}
            aria-label="Search prompts"
            className="w-full rounded-full border border-gray-200 dark:border-gray-800 bg-card py-4 pl-12 pr-12 text-base shadow-sm outline-none transition-shadow duration-150 hover:shadow-md focus:shadow-md focus:ring-2 focus:ring-primary/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {query && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {filtered.length} of {cards.length} match &quot;{query}&quot;
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            {query ? <>No prompts match &quot;{query}&quot;.</> : (emptyMessage ?? 'Nothing here yet.')}
          </p>
          {query && (
            <button type="button" onClick={() => setQuery('')} className="mt-3 text-sm font-semibold text-primary hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {filtered.map((card, i) => (
            <PromptGridCard key={card.key} card={card} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
