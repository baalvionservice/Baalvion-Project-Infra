"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface SubcategoryTabsProps {
  subcategories: any[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * @fileOverview Optimized Subcategory Navigation
 * Features smooth scrolling and tactical feedback for high-density domains.
 */
export function SubcategoryTabs({ subcategories, selectedId, onSelect }: SubcategoryTabsProps) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth px-1">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "px-6 h-11 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 border interactive-lift",
            !selectedId 
              ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200" 
              : "bg-white border-slate-100 text-slate-400 hover:border-blue-400 hover:text-blue-600"
          )}
        >
          All Specializations
        </button>
        {subcategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub.id)}
            className={cn(
              "px-6 h-11 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 border interactive-lift",
              selectedId === sub.id 
                ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200" 
                : "bg-white border-slate-100 text-slate-400 hover:border-blue-400 hover:text-blue-600"
            )}
          >
            {sub.name}
          </button>
        ))}
      </div>
      {/* Precision Visual Gradient for horizontal overflow */}
      <div className="absolute right-0 top-0 bottom-2 w-20 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none md:hidden" />
    </div>
  );
}
