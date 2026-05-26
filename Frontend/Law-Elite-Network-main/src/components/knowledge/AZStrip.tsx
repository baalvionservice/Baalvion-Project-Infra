
"use client";

import React from 'react';
import Link from 'next/link';

/**
 * @fileOverview Premium A–Z Strip
 * Tactile alphabetical navigation with horizontal mobile scroll.
 */
export function AZStrip() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-6 scroll-smooth px-1">
        {letters.map((letter) => (
          <Link 
            key={letter} 
            href={`/legal/${letter.toLowerCase()}`}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-200 hover:-translate-y-1.5 transition-all duration-500 font-serif text-lg"
          >
            {letter}
          </Link>
        ))}
      </div>
      {/* Premium Visual fade for horizontal overflow */}
      <div className="absolute right-0 top-0 bottom-6 w-20 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
    </div>
  );
}
