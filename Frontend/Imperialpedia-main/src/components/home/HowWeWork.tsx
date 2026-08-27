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
    <div>
      <h3 className="text-sm font-black uppercase tracking-widest text-primary/70">
        For Our Editors
      </h3>
      <p className="mt-1 text-base font-bold text-foreground">
        How Imperialpedia creates financial content
      </p>

      <div className="relative mt-6">
        <ol className="grid grid-cols-1 gap-6">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4">
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-sm">
                {i + 1}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  <h4 className="text-sm font-bold text-foreground">{title}</h4>
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-2 gap-y-1 text-sm font-semibold">
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
    </div>
  );
}
