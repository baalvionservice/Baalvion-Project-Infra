"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export type LegalKeyTerm = {
  term: string;
  definition: string;
  href: string;
};

interface KeyLegalTermsProps {
  title?: string;
  terms: LegalKeyTerm[];
}

/**
 * Interactive glossary widget for a practice-area page: one full definition
 * card on the left, a bank of term pills on the right to switch between them.
 * Same interaction pattern already used for Imperialpedia's finance topic
 * pages (InvestopediaKeyTerms.tsx), recolored to the Law Elite navy/elite
 * palette instead of re-deriving a new layout.
 */
export function KeyLegalTerms({ title = "Key Legal Terms", terms }: KeyLegalTermsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!terms || terms.length === 0) return null;
  const current = terms[activeIndex] ?? terms[0];

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % terms.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + terms.length) % terms.length);

  return (
    <section className="relative left-[calc(-50vw+50%)] w-screen bg-elite-navy py-16 px-4 sm:px-6 lg:px-8 text-white my-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {title}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Definition card */}
          <div className="lg:col-span-7 relative">
            <div className="relative bg-white text-slate-900 rounded-none border border-slate-200 p-8 sm:p-10 shadow-[8px_8px_0px_0px_#93c5fd] space-y-4">
              <h3 className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-950">
                {current.term}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Definition
              </p>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed min-h-[90px]">
                {current.definition}
              </p>
              <div className="pt-2">
                <Link
                  href={current.href}
                  className="text-sm font-semibold text-elite-600 hover:underline"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next term"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-elite-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous term"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 shadow-lg transition-transform hover:scale-110 hover:text-white active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Term selector pills */}
          <div className="lg:col-span-5 flex flex-wrap gap-2.5 content-start">
            {terms.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all text-left ${
                    isActive
                      ? "bg-white text-elite-navy shadow-md ring-2 ring-elite-600"
                      : "bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {item.term}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
