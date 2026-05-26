"use client";

import React from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';

/**
 * @fileOverview AZDiscoveryStrip
 * Prominent structural lookup for the homepage.
 */
export function AZDiscoveryStrip() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="space-y-12">
      <div className="text-center space-y-3">
        <h3 className="text-3xl font-bold text-slate-900">Browse Knowledge A–Z</h3>
        <p className="text-sm text-slate-500 font-medium italic">Audit the complete legal encyclopedia through our structural lookup.</p>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500 opacity-20" />
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          {letters.map((l) => (
            <Link 
              key={l} 
              href={`/legal/${l.toLowerCase()}`}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-xl font-bold text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 hover:shadow-xl hover:shadow-blue-200 transition-all duration-500 hover:-translate-y-1"
            >
              {l}
            </Link>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-center">
          <Link href="/legal">
            <button className="flex items-center gap-2 px-8 h-12 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
              <BookOpen className="w-4 h-4" /> Full Encyclopedia Access <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
