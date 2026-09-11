import React from "react";
import Link from "next/link";
import { Search, PenLine, ShieldCheck, RefreshCw, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Research",
    body: "Authoritative primary and institutional sources wherever possible.",
  },
  {
    icon: PenLine,
    title: "Explain",
    body: "Complex financial concepts turned into clear, structured guides.",
  },
  {
    icon: ShieldCheck,
    title: "Review",
    body: "Checked for factual accuracy, clarity, consistency, and usefulness.",
  },
  {
    icon: RefreshCw,
    title: "Update",
    body: "Revisited when rules, data, or market practices change.",
  },
  {
    icon: CheckCircle2,
    title: "Correct",
    body: "Errors are fixed with a transparent corrections process.",
  },
] as const;

/**
 * Editorial-facing half of the "How It Works" section (see HowItWorks.tsx) —
 * a compact numbered pipeline. No own <section> wrapper/heading: it's
 * embedded as one column of HowItWorks alongside HowToUse's reader-journey
 * column, under a single shared heading.
 */
export function HowWeWork() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
          FOR EDITORS
        </span>
        <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e]">
          // EDITORIAL PIPELINE
        </h3>
      </div>
      <h4 className="text-xl font-black uppercase font-serif text-black dark:text-white">
        How Content Is Verified &amp; Produced
      </h4>

      <div className="relative mt-4">
        <ol className="grid grid-cols-1 gap-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-700 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white font-mono font-black text-xs border-2 border-black">
                0{i + 1}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#c8102e]" aria-hidden />
                  <h5 className="text-sm font-black uppercase font-serif text-black dark:text-white">{title}</h5>
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-mono font-black uppercase">
        <Link href="/editorial-policy" className="bg-black text-white px-3 py-1 hover:bg-[#c8102e] transition-colors">
          Editorial Policy
        </Link>
        <Link href="/corrections" className="bg-black text-white px-3 py-1 hover:bg-[#c8102e] transition-colors">
          Corrections Policy
        </Link>
        <Link href="/methodology" className="bg-black text-white px-3 py-1 hover:bg-[#c8102e] transition-colors">
          Methodology
        </Link>
      </div>
    </div>
  );
}
