"use client";

import { PRICE_ABSOLUTE_MAX, PRICE_ABSOLUTE_MIN } from "@/lib/mock-category-data";
import { useState, useRef, useCallback } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

export function PriceRangeSlider({ min, max, onChange }: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);
  const rangeRef = useRef<HTMLDivElement>(null);

  const RANGE = PRICE_ABSOLUTE_MAX - PRICE_ABSOLUTE_MIN;

  const pctMin = ((localMin - PRICE_ABSOLUTE_MIN) / RANGE) * 100;
  const pctMax = ((localMax - PRICE_ABSOLUTE_MIN) / RANGE) * 100;

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.min(Number(e.target.value), localMax - 500);
      setLocalMin(val);
      onChange(val, localMax);
    },
    [localMax, onChange]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(Number(e.target.value), localMin + 500);
      setLocalMax(val);
      onChange(localMin, val);
    },
    [localMin, onChange]
  );

  const handleMinInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const val = Math.max(PRICE_ABSOLUTE_MIN, Math.min(Number(raw), localMax - 500));
    setLocalMin(val);
    onChange(val, localMax);
  };

  const handleMaxInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const val = Math.min(PRICE_ABSOLUTE_MAX, Math.max(Number(raw), localMin + 500));
    setLocalMax(val);
    onChange(localMin, val);
  };

  return (
    <div className="pt-1 pb-2">
      {/* Dual-handle slider track */}
      <div ref={rangeRef} className="relative h-[2px] bg-[#e0ddd9] mx-1 mt-2 mb-7">
        {/* Active fill */}
        <div
          className="absolute top-0 h-full bg-[#1a1a1a]"
          style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%` }}
        />

        {/* Min thumb visual */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[15px] h-[15px] rounded-full bg-white border-2 border-[#1a1a1a] shadow-sm pointer-events-none z-10"
          style={{ left: `${pctMin}%` }}
        />

        {/* Max thumb visual */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[15px] h-[15px] rounded-full bg-white border-2 border-[#1a1a1a] shadow-sm pointer-events-none z-10"
          style={{ left: `${pctMax}%` }}
        />

        {/* Hidden range inputs — stacked, transparent, full-width */}
        <input
          type="range"
          min={PRICE_ABSOLUTE_MIN}
          max={PRICE_ABSOLUTE_MAX}
          step={500}
          value={localMin}
          onChange={handleMinChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={PRICE_ABSOLUTE_MIN}
          max={PRICE_ABSOLUTE_MAX}
          step={500}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          aria-label="Maximum price"
        />
      </div>

      {/* Price input boxes — matching the original website exactly */}
      <div className="flex items-center justify-between gap-3 mt-4">
        {/* Min input */}
        <div className="flex-1">
          <label className="block text-[10px] tracking-[0.08em] text-[#999] font-normal mb-1.5 uppercase">
            From
          </label>
          <div className="border border-[#d5d2cd] flex items-center px-3 py-2 bg-white hover:border-[#1a1a1a] transition-colors focus-within:border-[#1a1a1a]">
            <span className="text-[12px] text-[#666] mr-1">$</span>
            <input
              type="text"
              value={Math.round(localMin).toLocaleString()}
              onChange={handleMinInput}
              className="flex-1 min-w-0 text-[12px] text-[#1a1a1a] bg-transparent outline-none font-normal tracking-wide"
            />
          </div>
        </div>

        {/* Separator */}
        <div className="w-4 h-px bg-[#d5d2cd] mt-5 flex-shrink-0" />

        {/* Max input */}
        <div className="flex-1">
          <label className="block text-[10px] tracking-[0.08em] text-[#999] font-normal mb-1.5 uppercase">
            To
          </label>
          <div className="border border-[#d5d2cd] flex items-center px-3 py-2 bg-white hover:border-[#1a1a1a] transition-colors focus-within:border-[#1a1a1a]">
            <span className="text-[12px] text-[#666] mr-1">$</span>
            <input
              type="text"
              value={Math.round(localMax).toLocaleString()}
              onChange={handleMaxInput}
              className="flex-1 min-w-0 text-[12px] text-[#1a1a1a] bg-transparent outline-none font-normal tracking-wide"
            />
          </div>
        </div>
      </div>
    </div>
  );
}