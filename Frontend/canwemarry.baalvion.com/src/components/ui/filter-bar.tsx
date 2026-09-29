'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from './input';
import { Button } from './button';
import { cn } from './cn';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchName?: string;
  filters?: { name: string; label: string; options: FilterOption[] }[];
}

/**
 * Search and facets, held entirely in the query string.
 *
 * Nothing filters client-side: the server decides which cases the caller may see, so a
 * filtered list is a fresh request rather than a subset of what was already delivered. A
 * client-side filter over a list would only ever be able to narrow what the server had
 * already agreed to send, which sounds harmless until someone assumes it does more.
 */
export function FilterBar({ searchPlaceholder = 'Search', searchName = 'q', filters = [] }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [term, setTerm] = useState(params.get(searchName) ?? '');

  const apply = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') q.delete(k); else q.set(k, v);
    }
    q.delete('page');
    router.push(`${pathname}${q.toString() ? `?${q}` : ''}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // The backend requires at least two characters; sending one returns a 400 that reads
    // like a fault rather than a hint, so an over-short term simply clears the search.
    apply({ [searchName]: term.trim().length >= 2 ? term.trim() : null });
  };

  const active = params.get(searchName);

  return (
    <div className="mb-8 space-y-4">
      <form onSubmit={onSubmit} role="search" className="flex gap-2">
        <label htmlFor="filter-search" className="sr-only">{searchPlaceholder}</label>
        <Input
          id="filter-search"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-md"
        />
        <Button type="submit" variant="secondary">Search</Button>
        {active && (
          <Button type="button" variant="ghost" onClick={() => { setTerm(''); apply({ [searchName]: null }); }}>
            Clear
          </Button>
        )}
      </form>

      {filters.map((f) => {
        const current = params.get(f.name) ?? '';
        return (
          <div key={f.name} className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted">{f.label}</span>
            {f.options.map((o) => {
              const on = current === o.value;
              return (
                <button
                  key={o.value || 'all'}
                  type="button"
                  aria-pressed={on}
                  onClick={() => apply({ [f.name]: o.value || null })}
                  className={cn(
                    'focus-ring inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors',
                    on
                      ? 'border-accent bg-accent-soft font-medium text-accent-strong'
                      : 'border-line-strong bg-surface text-muted hover:text-foreground',
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
