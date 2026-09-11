"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type KeyTermItem = {
  term: string;
  definition: string;
  href: string;
};

interface ImperialpediaKeyTermsProps {
  title?: string;
  terms: KeyTermItem[];
}

/**
 * Imperialpedia Style Category Dictionary & Key Terms Widget:
 * Deep black section with floating white Imperialpedia card on the left
 * and heavy black/red button selectors on the right.
 */
export function ImperialpediaKeyTerms({
  title = "Key Terms",
  terms,
}: ImperialpediaKeyTermsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!terms || terms.length === 0) return null;
  const current = terms[activeIndex] ?? terms[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % terms.length);
  };

  return (
    <section className="relative left-[calc(-50vw+50%)] w-screen bg-black py-16 px-4 sm:px-6 lg:px-8 text-white my-12 border-y-6 border-[#c8102e]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center gap-3 border-b-2 border-slate-800 pb-4">
          <span className="bg-[#c8102e] text-white text-xs font-black uppercase tracking-tighter px-3 py-1 -skew-x-12">
            IMPERIALPEDIA GLOSSARY
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-white uppercase font-serif">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: White floating card with definition and red shadow */}
          <div className="lg:col-span-7 relative">
            <div className="relative bg-white text-black p-8 sm:p-10 border-4 border-black shadow-[10px_10px_0px_0px_#c8102e] space-y-4 rounded-xs">
              <span className="inline-block bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
                FEATURED DEFINITION
              </span>
              <h3 className="text-3xl sm:text-4xl font-black text-black uppercase font-serif tracking-tight">
                {current.term}
              </h3>
              <p className="text-sm sm:text-base text-slate-800 font-semibold leading-relaxed min-h-[90px]">
                {current.definition}
              </p>
              <div className="pt-3 border-t-2 border-slate-200">
                <Link
                  href={current.href}
                  className="text-xs font-black uppercase tracking-wider text-[#c8102e] hover:text-black transition-colors flex items-center gap-1"
                >
                  <span>FULL DICTIONARY ENTRY →</span>
                </Link>
              </div>
            </div>

            {/* Next arrow button floating on the right of the card */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next term"
                className="flex h-12 w-12 items-center justify-center bg-[#c8102e] text-white shadow-xl hover:bg-white hover:text-black border-2 border-black transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </div>
          </div>

          {/* RIGHT: Grid of term buttons */}
          <div className="lg:col-span-5 flex flex-wrap gap-2.5 content-start">
            {terms.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`px-4 py-3 text-xs font-black uppercase tracking-wider transition-all text-left border-2 cursor-pointer ${
                    isActive
                      ? "bg-[#c8102e] text-white border-[#c8102e] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.9)]"
                      : "bg-[#18181b] text-slate-300 border-slate-800 hover:bg-white hover:text-black hover:border-white"
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
