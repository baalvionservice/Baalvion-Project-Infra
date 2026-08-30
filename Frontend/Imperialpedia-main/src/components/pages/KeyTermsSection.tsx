"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export type KeyTerm = {
  term: string;
  definition: string;
  href: string;
};

interface KeyTermsSectionProps {
  title?: string;
  terms: KeyTerm[];
}

/**
 * Investopedia-style Key Terms glossary widget.
 * Allows visitors to click between essential financial definitions with
 * one-click access to the full educational guide.
 */
export function KeyTermsSection({
  title = "Key Terms to Know",
  terms,
}: KeyTermsSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!terms || terms.length === 0) return null;
  const current = terms[activeIndex] ?? terms[0];

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      {/* Nav pill buttons */}
      <div className="flex flex-wrap gap-2">
        {terms.map((item, idx) => (
          <button
            key={item.term}
            type="button"
            onClick={() => setActiveIndex(idx)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
              idx === activeIndex
                ? "bg-foreground text-background shadow-sm"
                : "border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/40"
            }`}
          >
            {item.term}
          </button>
        ))}
      </div>

      {/* Term details box */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-6 space-y-3">
        <h3 className="text-lg font-bold text-foreground">
          {current.term}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {current.definition}
        </p>
        <div className="pt-2">
          <Link
            href={current.href}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
          >
            Read full guide on {current.term}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
