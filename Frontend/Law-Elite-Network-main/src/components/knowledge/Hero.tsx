"use client";

import React from 'react';
import { Search, Sparkles, ShieldCheck } from 'lucide-react';
import SearchBar from '../search/SearchBar';

/**
 * @fileOverview Premium Hero Section
 * High-impact module with responsive typography and centering.
 */
export function Hero() {
  return (
    <section className="relative pt-24 md:pt-40 pb-32 md:pb-48 overflow-hidden bg-white">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-blue-50/40 rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          Verified Legal Intelligence Protocol
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tighter text-slate-900 mb-6 md:mb-8 leading-[1.1] md:leading-[0.95] animate-in fade-in duration-1000 delay-200 px-2">
          The Global Legal <br className="hidden md:block" /> Knowledge Network
        </h1>

        <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 md:mb-16 leading-relaxed font-medium italic animate-in fade-in duration-1000 delay-500 px-4">
          Explore specialized legal topics, strategic guides, and expert professional insights across every global jurisdiction.
        </p>

        <div className="max-w-3xl mx-auto relative group animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-700 px-2">
          <div className="absolute -top-8 right-4 flex items-center gap-2 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-blue-600/60 hidden sm:flex">
            <Sparkles className="w-3 h-3 animate-pulse" /> Precision Matching Active
          </div>
          
          <SearchBar variant="hero" />
        </div>
      </div>
    </section>
  );
}
