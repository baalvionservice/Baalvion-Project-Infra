import React from "react";
import { BookOpen, Network, Calculator, ShieldCheck, ChevronRight } from "lucide-react";

const STEPS = [
  {
    icon: BookOpen,
    title: "Learn the concept",
    body: "Start with a clear explanation of the financial term or topic.",
  },
  {
    icon: Network,
    title: "Understand the context",
    body: "Follow related articles to understand how the concept connects to markets, economics or personal finance.",
  },
  {
    icon: Calculator,
    title: "Explore the numbers",
    body: "Use relevant market data and financial calculators where available.",
  },
  {
    icon: ShieldCheck,
    title: "Verify the information",
    body: "Review the sources and references provided with the article.",
  },
] as const;

/**
 * Reader-facing half of the "How It Works" section (see HowItWorks.tsx) — a
 * Learn → Understand → Apply path on a connected timeline. No own <section>
 * wrapper/heading: it's embedded as one column of HowItWorks alongside
 * HowWeWork's editorial-process column, under a single shared heading.
 */
export function HowToUse() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
          FOR READERS
        </span>
        <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e]">
          // READER DISCOVERY ROADMAP
        </h3>
      </div>
      <h4 className="text-xl font-black uppercase font-serif text-black dark:text-white">
        How to Use Imperialpedia
      </h4>

      <div className="relative mt-4">
        <ol className="grid grid-cols-1 gap-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-4 bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-700 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center bg-[#c8102e] text-white font-black text-xs font-mono -skew-x-6 border-2 border-black">
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
    </div>
  );
}
