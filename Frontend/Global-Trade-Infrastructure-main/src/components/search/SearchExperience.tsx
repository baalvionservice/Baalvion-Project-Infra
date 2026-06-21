'use client';

/**
 * @file components/search/SearchExperience.tsx
 * @description PROMPT 8 — the marketplace search container. Canonical query state
 * lives in the URL (shareable, back-button friendly): it parses the params, calls
 * `/api/search`, and renders the bar + facet rail + ranked results + pagination.
 * Every interaction writes the URL and the effect re-queries.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, SearchX, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from './SearchBar';
import { FacetSidebar } from './FacetSidebar';
import { ResultCard } from './ResultCard';
import {
  searchCatalog,
  buildSearchQueryString,
  type SearchParams,
  type SearchResult,
  type SearchSort,
} from '@/lib/search-client';

const SORT_OPTIONS: Array<{ value: SearchSort; label: string }> = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
];

function parseParams(sp: URLSearchParams): SearchParams {
  const num = (k: string): number | undefined => {
    const v = sp.get(k);
    if (v === null || v.trim() === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const sort = sp.get('sort');
  return {
    q: sp.get('q') ?? undefined,
    countries: sp.getAll('country'),
    categories: sp.getAll('category'),
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    sort: (['price_asc', 'price_desc', 'newest', 'relevance'].includes(sort ?? '') ? sort : undefined) as SearchSort | undefined,
    page: num('page'),
  };
}

function toggle(list: string[] | undefined, key: string): string[] {
  const set = new Set(list ?? []);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return [...set];
}

export function SearchExperience() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = useMemo(() => parseParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const queryKey = buildSearchQueryString(params);

  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    searchCatalog(params, controller.signal)
      .then((r) => {
        setResult(r);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const push = useCallback(
    (next: SearchParams) => {
      const qs = buildSearchQueryString(next);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname],
  );

  const onSubmitQuery = (q: string) => push({ ...params, q: q || undefined, page: 1 });
  const onToggleCountry = (key: string) => push({ ...params, countries: toggle(params.countries, key), page: 1 });
  const onToggleCategory = (key: string) => push({ ...params, categories: toggle(params.categories, key), page: 1 });
  const onSelectPriceBucket = (from: number | null, to: number | null) =>
    push({ ...params, minPrice: from ?? undefined, maxPrice: to ?? undefined, page: 1 });
  const onApplyCustomPrice = (min?: number, max?: number) =>
    push({ ...params, minPrice: min, maxPrice: max, page: 1 });
  const onClearAll = () => push({ q: params.q });
  const onSort = (sort: SearchSort) => push({ ...params, sort, page: 1 });
  const goToPage = (page: number) => push({ ...params, page });

  const hasActiveFilters =
    (params.countries?.length ?? 0) > 0 ||
    (params.categories?.length ?? 0) > 0 ||
    params.minPrice !== undefined ||
    params.maxPrice !== undefined;

  const total = result?.total ?? 0;
  const pageSize = result?.pageSize ?? 24;
  const page = result?.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <SearchBar initialValue={params.q ?? ''} onSubmit={onSubmitQuery} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="lg:sticky lg:top-4 lg:self-start">
          {result ? (
            <FacetSidebar
              facets={result.facets}
              minPrice={params.minPrice}
              maxPrice={params.maxPrice}
              onToggleCountry={onToggleCountry}
              onToggleCategory={onToggleCategory}
              onSelectPriceBucket={onSelectPriceBucket}
              onApplyCustomPrice={onApplyCustomPrice}
              onClearAll={onClearAll}
              hasActiveFilters={hasActiveFilters}
            />
          ) : (
            <Skeleton className="h-96 w-full rounded-xl" />
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              {loading ? 'Searching…' : (
                <>
                  <span className="font-black text-foreground tabular-nums">{total.toLocaleString()}</span> results
                  {params.q ? <> for “<span className="font-semibold text-foreground">{params.q}</span>”</> : null}
                  {result?.capped && <span className="ml-1 text-amber-600">(showing top matches)</span>}
                </>
              )}
            </p>
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sort
              <select
                value={params.sort ?? 'relevance'}
                onChange={(e) => onSort(e.target.value as SearchSort)}
                className="h-9 rounded-md border border-border bg-background px-2 text-sm font-medium text-foreground"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-12 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            </div>
          ) : loading && !result ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : result && result.items.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {result.items.map((hit) => (
                  <ResultCard key={hit.id} hit={hit} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-3 text-sm tabular-nums text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
              <SearchX className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-bold uppercase tracking-wider">No results</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Nothing matched your search and filters. Try a broader term or clear a filter.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="rounded-md bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-widest text-primary-foreground"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
