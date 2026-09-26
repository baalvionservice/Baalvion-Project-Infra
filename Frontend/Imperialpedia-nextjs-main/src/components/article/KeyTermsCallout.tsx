"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getKeyTermsForTopic } from "@/lib/topic-key-terms";

interface KeyTermsCalloutProps {
  categorySlug?: string;
  className?: string;
}

export function KeyTermsCallout({ categorySlug = "savings", className = "" }: KeyTermsCalloutProps) {
  const terms = getKeyTermsForTopic(categorySlug).slice(0, 3);
  if (!terms || terms.length === 0) return null;

  return (
    <div
      className={`my-12 p-6 sm:p-8 bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)] relative rounded-xs ${className}`}
    >
      {/* Top Red Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />

      <div className="flex items-center justify-between gap-3 mb-6 border-b-2 border-black dark:border-slate-800 pb-3.5 pt-1">
        <div className="flex items-center gap-2">
          <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
            IMPERIALPEDIA GLOSSARY
          </span>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white font-mono">
            KEY TERMS DEFINED IN THIS GUIDE
          </h3>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-500 hidden sm:inline">
          FINANCIAL DICTIONARY
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {terms.map((item) => (
          <div
            key={item.term}
            className="flex flex-col justify-between bg-slate-50 dark:bg-slate-800/80 p-5 border-2 border-black dark:border-slate-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
          >
            <div>
              <span className="inline-block text-[9px] font-mono font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 mb-2">
                TERM
              </span>
              <h4 className="text-base font-black text-black dark:text-white mb-2 leading-tight uppercase font-serif">
                {item.term}
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {item.definition}
              </p>
            </div>
            {item.href && (
              <Link
                href={item.href}
                className="mt-4 pt-3 border-t border-slate-300 dark:border-slate-700 inline-flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#c8102e] hover:text-black dark:hover:text-white transition-colors"
              >
                <span>FULL DEFINITION</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
