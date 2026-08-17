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
 * "How Imperialpedia Creates Financial Content" — a compact stepper/pipeline
 * (numbered nodes on a continuous colored track) rather than a card grid, so
 * it reads distinctly from HowToUse's timeline and WhatWeCover's bordered
 * cards despite all three sitting in the same part of the page. Sits inside
 * the tinted "trust chapter" band (see page.tsx) grouping it with Editorial
 * Standards, the Editorial Team, and Sources.
 */
export function HowWeWork() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl">
        <span className="eyebrow">Our Process</span>
        <h2 className="mt-1.5 text-2xl font-black tracking-tight text-foreground">
          How Imperialpedia Creates Financial Content
        </h2>
      </div>

      <div className="relative mt-10">
        <div className="hidden sm:block absolute left-0 right-0 top-5 h-0.5 bg-primary/15" aria-hidden />
        <ol className="grid grid-cols-1 gap-8 sm:grid-cols-5 sm:gap-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4 sm:flex-col sm:gap-0 sm:text-center">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-sm sm:mx-auto">
                {i + 1}
              </div>
              <div className="sm:mt-3">
                <div className="flex items-center gap-1.5 sm:justify-center">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-2 gap-y-1 text-sm font-semibold">
        <Link href="/editorial-policy" className="text-primary hover:underline underline-offset-2">
          Editorial Policy
        </Link>
        <span className="text-muted-foreground" aria-hidden>·</span>
        <Link href="/corrections" className="text-primary hover:underline underline-offset-2">
          Corrections Policy
        </Link>
        <span className="text-muted-foreground" aria-hidden>·</span>
        <Link href="/methodology" className="text-primary hover:underline underline-offset-2">
          Methodology
        </Link>
      </div>
    </section>
  );
}

export default HowWeWork;
