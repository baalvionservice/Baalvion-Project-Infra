'use client';

/**
 * @file components/search/FacetSidebar.tsx
 * @description PROMPT 8 — the faceted-filter rail: Country, Category and Price.
 * Counts come straight from the search response (each facet already excludes its
 * own selection). Selecting a value calls back to the parent, which writes it to
 * the URL and re-queries. Price offers preset buckets plus a custom min/max.
 */
import { useEffect, useState } from 'react';
import { MapPin, Tag, Wallet, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FacetBucket, PriceFacetBucket, SearchFacets } from '@/lib/search-client';

type Props = {
  facets: SearchFacets;
  minPrice?: number;
  maxPrice?: number;
  onToggleCountry: (key: string) => void;
  onToggleCategory: (key: string) => void;
  onSelectPriceBucket: (from: number | null, to: number | null) => void;
  onApplyCustomPrice: (min?: number, max?: number) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
};

function FacetGroup({
  title,
  icon,
  buckets,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  buckets: FacetBucket[];
  onToggle: (key: string) => void;
}) {
  if (buckets.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </div>
      <ul className="space-y-0.5">
        {buckets.slice(0, 12).map((b) => (
          <li key={b.key}>
            <button
              type="button"
              onClick={() => onToggle(b.key)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                b.selected && 'bg-primary/10 font-semibold text-primary',
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    b.selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40',
                  )}
                >
                  {b.selected && <span className="text-[10px] leading-none">✓</span>}
                </span>
                <span className="truncate">{b.label}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{b.count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriceGroup({
  buckets,
  minPrice,
  maxPrice,
  onSelectBucket,
  onApplyCustom,
}: {
  buckets: PriceFacetBucket[];
  minPrice?: number;
  maxPrice?: number;
  onSelectBucket: (from: number | null, to: number | null) => void;
  onApplyCustom: (min?: number, max?: number) => void;
}) {
  const [min, setMin] = useState(minPrice?.toString() ?? '');
  const [max, setMax] = useState(maxPrice?.toString() ?? '');
  useEffect(() => setMin(minPrice?.toString() ?? ''), [minPrice]);
  useEffect(() => setMax(maxPrice?.toString() ?? ''), [maxPrice]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" />
        Price
      </div>
      <ul className="space-y-0.5">
        {buckets.map((b) => (
          <li key={b.key}>
            <button
              type="button"
              onClick={() => onSelectBucket(b.selected ? null : b.from, b.selected ? null : b.to)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted',
                b.selected && 'bg-primary/10 font-semibold text-primary',
              )}
            >
              <span className="truncate">{b.label}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{b.count}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 pt-1">
        <input
          inputMode="decimal"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder="Min"
          aria-label="Minimum price"
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
        />
        <span className="text-muted-foreground">–</span>
        <input
          inputMode="decimal"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Max"
          aria-label="Maximum price"
          className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
        />
        <button
          type="button"
          onClick={() =>
            onApplyCustom(min.trim() ? Number(min) : undefined, max.trim() ? Number(max) : undefined)
          }
          className="h-9 shrink-0 rounded-md bg-primary px-3 text-[11px] font-black uppercase tracking-widest text-primary-foreground hover:opacity-90"
        >
          Go
        </button>
      </div>
    </div>
  );
}

export function FacetSidebar({
  facets,
  minPrice,
  maxPrice,
  onToggleCountry,
  onToggleCategory,
  onSelectPriceBucket,
  onApplyCustomPrice,
  onClearAll,
  hasActiveFilters,
}: Props) {
  return (
    <aside className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      <FacetGroup title="Country" icon={<MapPin className="h-3.5 w-3.5" />} buckets={facets.country} onToggle={onToggleCountry} />
      <FacetGroup title="Category" icon={<Tag className="h-3.5 w-3.5" />} buckets={facets.category} onToggle={onToggleCategory} />
      <PriceGroup
        buckets={facets.price}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onSelectBucket={onSelectPriceBucket}
        onApplyCustom={onApplyCustomPrice}
      />
    </aside>
  );
}
