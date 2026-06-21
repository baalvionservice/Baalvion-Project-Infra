'use client';

/**
 * @file components/search/SearchBar.tsx
 * @description PROMPT 8 — the marketplace search box: a debounced type-ahead that
 * queries `/api/search/suggest` and submits the keyword on Enter or suggestion
 * click. Purely presentational beyond its own suggestion fetch; the parent owns
 * the canonical query (URL) state.
 */
import { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { suggestCatalog, type SearchSuggestion } from '@/lib/search-client';

type Props = {
  initialValue: string;
  onSubmit: (q: string) => void;
};

export function SearchBar({ initialValue, onSubmit }: Props) {
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the input in sync when the URL-driven value changes underneath us.
  useEffect(() => setValue(initialValue), [initialValue]);

  // Debounced suggestion fetch.
  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(() => {
      setLoading(true);
      suggestCatalog(term, controller.signal)
        .then((s) => {
          setSuggestions(s);
          setOpen(true);
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function submit(q: string) {
    setOpen(false);
    onSubmit(q.trim());
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit(value);
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Search products, commodities, brands, HS codes…"
          aria-label="Search the marketplace catalogue"
          className="h-12 pl-11 pr-24 text-sm font-medium"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {value && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setValue('');
                submit('');
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => submit(value)}
            className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground hover:opacity-90"
          >
            Search
          </button>
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setValue(s.title);
                  submit(s.title);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted',
                )}
              >
                <span className="truncate font-medium">{s.title}</span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.entityType.replace(/_/g, ' ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
