"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export type KeyTermItem = {
  term: string;
  definition: string;
  href: string;
};

interface InvestopediaKeyTermsProps {
  title?: string;
  terms: KeyTermItem[];
}

/**
 * Exact Investopedia Key Terms widget:
 * Dark navy blue section with a white definition card on the left
 * and button selector pills on the right.
 */
export function InvestopediaKeyTerms({
  title = "Key Terms",
  terms,
}: InvestopediaKeyTermsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!terms || terms.length === 0) return null;
  const current = terms[activeIndex] ?? terms[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % terms.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + terms.length) % terms.length);
  };

  return (
    <section className="relative left-[calc(-50vw+50%)] w-screen bg-[#1b2a47] py-16 px-4 sm:px-6 lg:px-8 text-white my-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          {title}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: White floating card with definition and blue shadow */}
          <div className="lg:col-span-7 relative">
            <div className="relative bg-white text-gray-900 rounded-none border border-gray-200 p-8 sm:p-10 shadow-[8px_8px_0px_0px_#93c5fd] space-y-4">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-950">
                {current.term}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Definition
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed min-h-[90px]">
                {current.definition}
              </p>
              <div className="pt-2">
                <Link
                  href={current.href}
                  className="text-sm font-semibold text-[#1d4fc4] hover:underline"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Next arrow button floating on the right of the card */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next term"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              >
                <ChevronRight className="h-6 w-6" />
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
                  className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all text-left ${
                    isActive
                      ? "bg-white text-[#1b2a47] shadow-md ring-2 ring-[#3b82f6]"
                      : "bg-[#273a5e] text-gray-200 hover:bg-[#334b77] hover:text-white"
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
