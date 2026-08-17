import React from "react";
import { BookOpen, Network, Calculator, ShieldCheck, ChevronRight } from "lucide-react";
import { HomeSectionHeading } from "./HomeSectionHeading";

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
 * "How to Use Imperialpedia" — a Learn → Understand → Apply path rendered as
 * a connected timeline (a joining line/chevron between steps) rather than
 * another bordered card grid, so it reads as a journey through the site
 * instead of repeating WhatWeCover's card template one section down.
 */
export function HowToUse() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
      <HomeSectionHeading title="How to Use Imperialpedia" />
      <div className="relative">
        <div
          className="hidden lg:block absolute left-0 right-0 top-6 h-px bg-gradient-to-r from-transparent via-border to-transparent"
          aria-hidden
        />
        <ol className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-4 lg:flex-col lg:gap-0">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                <Icon className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <div className="lg:mt-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-primary/70">
                  Step {i + 1}
                </span>
                <h3 className="mt-0.5 text-base font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed lg:pr-4">{body}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight
                  className="hidden lg:block absolute -right-3 top-3 h-5 w-5 text-border"
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default HowToUse;
