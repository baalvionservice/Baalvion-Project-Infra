"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface AlphabetFilterProps {
  selected: string | null;
  onSelect: (letter: string | null) => void;
}

/**
 * @fileOverview Optimized Alphabetic Filter
 * Surgically tuned for interactive discoverability and editorial aesthetics.
 */
export function AlphabetFilter({ selected, onSelect }: AlphabetFilterProps) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "flex-shrink-0 px-4 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500 border interactive-lift",
            !selected 
              ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
              : "bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-400 hover:text-blue-600"
          )}
        >
          All Topics
        </button>
        {letters.map((letter) => (
          <button
            key={letter}
            onClick={() => onSelect(letter === selected ? null : letter)}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-xl text-[11px] font-bold transition-all duration-500 border flex items-center justify-center font-serif interactive-lift",
              selected === letter 
                ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-110" 
                : "bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-400 hover:text-blue-600"
            )}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none md:hidden" />
    </div>
  );
}
