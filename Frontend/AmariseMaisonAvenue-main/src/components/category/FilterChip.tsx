"use client";

import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-2 border border-[#1a1a1a] px-3 py-[5px] text-[11px] tracking-[0.04em] font-normal text-[#1a1a1a]">
      {label}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex items-center justify-center hover:opacity-50 transition-opacity"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-[11px] h-[11px]" strokeWidth={1.8} />
      </button>
    </span>
  );
}