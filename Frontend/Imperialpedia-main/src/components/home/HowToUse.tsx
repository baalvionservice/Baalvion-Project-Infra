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
    <div>
      <h3 className="text-sm font-black uppercase tracking-widest text-primary/70">
        For Readers
      </h3>
      <p className="mt-1 text-base font-bold text-foreground">How to use Imperialpedia</p>
      <div className="relative mt-6">
        <ol className="grid grid-cols-1 gap-6">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-4">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                  Step {i + 1}
                </span>
                <h4 className="mt-0.5 text-sm font-bold text-foreground">{title}</h4>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight
                  className="absolute left-[15px] top-11 h-4 w-4 rotate-90 text-border"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
