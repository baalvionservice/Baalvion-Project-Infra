
"use client";

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

/**
 * @fileOverview LegalDirectoryPage
 * Premium A–Z directory for global legal discovery.
 */
export default function LegalDirectoryPage() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <header className="text-center mb-20 space-y-8">
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Legal Encyclopedia Index
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 font-serif">
              Browse Topics <span className="text-blue-600 italic">A–Z</span>
            </h1>
            <p className="text-slate-500 text-xl font-medium italic max-w-2xl mx-auto leading-relaxed">
              Access expert-verified guides and strategic insights categorized alphabetically across all global legal domains.
            </p>
          </header>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
            {letters.map((letter) => (
              <Link 
                key={letter} 
                href={`/legal/${letter.toLowerCase()}`}
                className="group"
              >
                <div className="aspect-square bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-2xl hover:border-blue-400 hover:-translate-y-2 transition-all duration-500">
                  <span className="text-4xl font-bold text-slate-400 group-hover:text-blue-600 transition-colors font-serif">
                    {letter}
                  </span>
                  <div className="flex items-center text-[8px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Explore <ArrowRight className="w-2.5 h-2.5 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-32 p-16 rounded-[4rem] bg-slate-900 text-white relative overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <ShieldCheck className="w-48 h-48" />
            </div>
            <div className="relative z-10 max-w-2xl space-y-6">
              <h3 className="text-3xl font-bold font-serif italic">Unparalleled Discovery Velocity</h3>
              <p className="text-slate-400 text-lg leading-relaxed italic font-medium">
                Our alphabetical index covers 120+ jurisdictions and 12 major legal domains, ensuring that high-intent intelligence is always within reach for discerning members.
              </p>
              <div className="pt-8 flex items-center gap-3 text-blue-400 font-bold uppercase text-xs tracking-[0.2em]">
                <ShieldCheck className="w-5 h-5" />
                Knowledge Integrity Protocol Active
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
