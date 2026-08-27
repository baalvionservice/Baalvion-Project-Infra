import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeSectionHeading } from "./HomeSectionHeading";

// Core evergreen guides, hand-picked rather than pulled from recency — these
// are the pages everything else on the site should eventually link back to.
// Every href below is a real, live published page (verified against prod,
// not a generated/guessed slug).
const FOUNDATIONS = [
  { title: "What Is Compound Interest?", href: "/financial-tools/compound-interest" },
  { title: "What Is Inflation?", href: "/inflation/complete-guide-to-inflation" },
  { title: "How Interest Rates Work", href: "/interest-rates/complete-guide-to-interest-rates" },
  { title: "How the Stock Market Works", href: "/personal-finance/understanding-the-stock-market" },
  { title: "What Is an ETF?", href: "/etfs/etfs" },
  { title: "What Is a Credit Score?", href: "/credit-cards/credit-scores-and-credit-utilization" },
  { title: "How Bonds Work", href: "/bonds/bonds" },
  { title: "What Is GDP?", href: "/gdp/complete-guide-to-gdp" },
] as const;

/**
 * "Featured Knowledge" — a curated set of core evergreen guides ("Financial
 * Foundations"), deliberately hand-picked rather than driven by recency like
 * the Latest Articles / Popular Reads rails above. These are the pages the
 * rest of the site's internal linking should anchor to.
 */
export function FeaturedKnowledge() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Featured Knowledge" />
      <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Financial Foundations
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-1">
        {FOUNDATIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between gap-2 py-2.5 border-b border-border text-sm font-bold text-foreground hover:text-primary transition-colors"
          >
            {item.title}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
