"use client";

import { X } from "lucide-react";
import { FilterChip } from "./FilterChip";
import { FilterKey, UseFilterReturn } from "@/hooks/useFilter";
import {
  COLORS,
  formatPriceShort,
  HARDWARE_OPTIONS,
  SIZE_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/mock-category-data";
import { FilterAccordion } from "./FilterAccordian";
import { FilterCheckbox } from "./FilterCheckbox";
import { PriceRangeSlider } from "./PriceRangesSlider";

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filter: UseFilterReturn;
}

export function FilterSheet({ open, onClose, filter }: FilterSheetProps) {
  const {
    state,
    toggle,
    setPrice,
    clearAll,
    removeChip,
    chips,
    hasPriceChip,
    totalActive,
  } = filter;

  const priceChipLabel = `${formatPriceShort(
    state.priceMin
  )} –${formatPriceShort(state.priceMax)}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel — responsive sheet */}
      <div
        className={`fixed inset-y-0 left-0 sm:top-0 sm:right-0 sm:left-auto h-full w-[88%] sm:max-w-[444px] bg-white z-[60] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          open
            ? "translate-x-0 sm:translate-x-0"
            : "-translate-x-full sm:translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Filter products"
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-[22px] border-b border-[#e8e6e3]">
          <span className="text-[12px] font-bold tracking-[0.13em] text-[#1a1a1a] uppercase">
            Filter By
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 hover:opacity-50 transition-opacity"
            aria-label="Close filter"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Active Chips ──────────────────────────────────────────── */}
        {(chips.length > 0 || hasPriceChip) && (
          <div className="flex flex-wrap gap-2 px-6 py-3.5 border-b border-[#e8e6e3]">
            {hasPriceChip && (
              <FilterChip
                label={priceChipLabel}
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
          </div>
        )}

        {/* ── Scrollable Body ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-0">
          {/* COLOR */}
          <FilterAccordion label="Color">
            <div className="space-y-[13px] pt-0">
              {COLORS.map((c) => (
                <FilterCheckbox
                  key={c.name}
                  label={c.name}
                  count={c.count}
                  checked={state.color.includes(c.name)}
                  onChange={() => toggle("color", c.name)}
                  swatch={
                    <span
                      className={`w-[15px] h-[15px] rounded-full flex-shrink-0 ${
                        c.border ? "border border-[#ccc]" : ""
                      }`}
                      style={{
                        background: c.isMulti
                          ? "conic-gradient(#e8622a, #c9a84c, #2d6a4f, #3b5998, #722f37, #e8829b, #e8622a)"
                          : c.hex,
                      }}
                    />
                  }
                />
              ))}
            </div>
          </FilterAccordion>

          {/* HARDWARE */}
          <FilterAccordion label="Hardware">
            <div className="space-y-[13px] pt-0">
              {HARDWARE_OPTIONS.map((h) => (
                <FilterCheckbox
                  key={h}
                  label={h}
                  checked={state.hardware.includes(h)}
                  onChange={() => toggle("hardware", h)}
                />
              ))}
            </div>
          </FilterAccordion>

          {/* SIZE */}
          <FilterAccordion label="Size">
            <div className="space-y-[13px] pt-0">
              {SIZE_OPTIONS.map((s) => (
                <FilterCheckbox
                  key={s}
                  label={s}
                  checked={state.size.includes(s)}
                  onChange={() => toggle("size", s)}
                />
              ))}
            </div>
          </FilterAccordion>

          {/* PRICE */}
          <FilterAccordion label="Price" defaultOpen>
            <PriceRangeSlider
              min={state.priceMin}
              max={state.priceMax}
              onChange={setPrice}
            />
          </FilterAccordion>

          {/* STYLE */}
          <FilterAccordion label="Style">
            <div className="space-y-[13px] pt-0">
              {STYLE_OPTIONS.map((s) => (
                <FilterCheckbox
                  key={s}
                  label={s}
                  checked={state.style.includes(s)}
                  onChange={() => toggle("style", s)}
                />
              ))}
            </div>
          </FilterAccordion>
        </div>

        {/* ── Footer — Clear All + View ─────────────────────────────── */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-3 px-6 py-5 border-t border-[#e8e6e3] bg-white">
          <button
            onClick={clearAll}
            className="h-[52px] border border-[#1a1a1a] bg-white text-[#1a1a1a] text-[10px] font-bold tracking-[0.22em] uppercase transition-colors hover:bg-[#f5f4f2] active:bg-[#ece9e4]"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="h-[52px] border border-[#1a1a1a] bg-[#1a1a1a] text-white text-[10px] font-bold tracking-[0.22em] uppercase transition-colors hover:bg-[#333] active:bg-[#000]"
          >
            View ({totalActive > 0 ? totalActive * 14 + 6 : 6})
          </button>
        </div>
      </div>
    </>
  );
}
