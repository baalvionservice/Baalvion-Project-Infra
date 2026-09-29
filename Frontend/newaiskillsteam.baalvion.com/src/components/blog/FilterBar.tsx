"use client";

import { FILTERS } from "./data";

interface FilterBarProps {
  active: string;
  onFilter: (key: string) => void;
}

export default function FilterBar({ active, onFilter }: FilterBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3.5 flex gap-2 flex-wrap items-center justify-center">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilter(f.key)}
          className={`text-xs font-semibold px-3.5 py-[5px] rounded-full cursor-pointer border transition-all whitespace-nowrap font-[inherit] ${
            active === f.key
              ? "bg-green-600 border-green-600 text-white"
              : "bg-gray-50 border-gray-200 text-gray-500 hover:border-green-600 hover:text-green-600"
          }`}
        >
          {f.label}
          <span
            className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
              active === f.key ? "bg-white/30" : "bg-gray-100"
            }`}
          >
            {f.count}
          </span>
        </button>
      ))}
    </div>
  );
}
