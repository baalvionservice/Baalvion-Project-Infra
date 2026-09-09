import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeSectionHeading } from "./HomeSectionHeading";
import { withoutRetired } from "@/lib/content/retired-paths";

// Core evergreen guides, hand-picked rather than pulled from recency — these
// are the pages everything else on the site should eventually link back to.
//
// Every href below is a real, live published page. The previous set pointed at
// /inflation, /etfs, /bonds, /gdp, /credit-cards, /interest-rates and
// /personal-finance guides — 7 of these 8 links — all of which now 301 to the
// homepage under the category retirement, so the most prominent block on the
// homepage bounced readers straight back to where they started. Drawn only from
// the two live pillars (/stocks, /budgeting-basics) plus a live calculator, and
// filtered through isRetiredPath at render so a future retirement pass can't
// reintroduce the same dead end silently.
const FOUNDATIONS = [
  { title: "What Is a Stock?", href: "/stocks/what-is-a-stock" },
  { title: "How the Stock Market Works", href: "/stocks/what-is-the-stock-market" },
  { title: "How Stock Exchanges Work", href: "/stocks/how-stock-exchanges-work" },
  { title: "What Is Market Capitalization?", href: "/stocks/what-is-market-capitalization" },
  { title: "What Is a Budget?", href: "/budgeting-basics/what-is-a-budget" },
  { title: "How to Build an Emergency Fund", href: "/budgeting-basics/building-emergency-fund-into-your-budget" },
  { title: "Understanding the P/E Ratio", href: "/stocks/price-to-earnings-ratio-explained" },
  { title: "What Is Compound Interest?", href: "/financial-tools/compound-interest" },
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
        {withoutRetired(FOUNDATIONS).map((item) => (
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
