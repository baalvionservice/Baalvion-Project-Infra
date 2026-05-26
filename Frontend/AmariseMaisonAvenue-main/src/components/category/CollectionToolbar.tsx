"use client";

import { SlidersHorizontal } from "lucide-react";
import { FilterChip } from "./FilterChip";
import { formatPriceShort } from "@/lib/mock-category-data";
import { FilterKey, UseFilterReturn } from "@/hooks/useFilter";

interface CollectionToolbarProps {
  totalProducts: number;
  filter: UseFilterReturn;
  onFilterOpen: () => void;
}

export function CollectionToolbar({
  totalProducts,
  filter,
  onFilterOpen,
}: CollectionToolbarProps) {
  const {
    chips,
    hasPriceChip,
    totalActive,
    removeChip,
    clearAll,
    state,
    sort,
    setSort,
  } = filter;

  return (
    <div className="space-y-4">
      {/* ── Top bar: count | filter | sort ── */}
      <div className="flex items-center justify-between py-4 md:px-6 bg-[#f8f7f5]">
        {/* Product count */}
        <span className="hidden md:flex  w-full text-[11px] font-semibold text-[#1a1a1a] uppercase tracking-[0.14em]">
          {totalProducts} products
        </span>

        <div className="flex items-center w-full justify-around md:gap-8">
          {/* Filter button */}
          <button
            onClick={onFilterOpen}
            className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] text-[#1a1a1a] uppercase hover:opacity-55 transition-opacity"
          >
            <span>Filter</span>
            <SlidersHorizontal
              className="w-[15px] h-[15px]"
              strokeWidth={1.5}
            />
            {totalActive > 0 && (
              <span className="w-[18px] h-[18px] rounded-full bg-[#1a1a1a] text-white text-[9px] font-bold flex items-center justify-center leading-none flex-shrink-0">
                {totalActive}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase">
            <span className="text-[#aaa] font-semibold">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-[#1a1a1a] font-bold outline-none cursor-pointer text-[11px] tracking-[0.14em] uppercase"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <span className="md:hidden w-full text-[10px]  text-[#1a1a1a]  tracking-[0.1em]">
        {totalProducts} products
      </span>

      {/* ── Active filter chips strip ── */}
      {(chips.length > 0 || hasPriceChip) && (
        <div className="hidden md:flex flex-wrap items-center gap-2">
          {hasPriceChip && (
            <FilterChip
              label={`${formatPriceShort(state.priceMin)} –${formatPriceShort(
                state.priceMax
              )}`}
              onRemove={() => removeChip("price")}
            />
          )}
          {chips.map(({ key, val }) => (
            <FilterChip
              key={`${key}-${val}`}
              label={val}
              onRemove={() => removeChip(key as FilterKey, val)}
            />
          ))}
          <button
            onClick={clearAll}
            className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#999] hover:text-[#1a1a1a] transition-colors underline underline-offset-4 ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
