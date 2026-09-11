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
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <HomeSectionHeading title="FEATURED KNOWLEDGE // FINANCIAL FOUNDATIONS" />
      
      <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative rounded-xs">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
        
        <div className="flex items-center gap-2 mb-6 pt-1 border-b-2 border-black dark:border-slate-800 pb-3">
          <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
            IMPERIALPEDIA FOUNDATIONS
          </span>
          <span className="text-xs font-mono font-black uppercase tracking-widest text-black dark:text-white">
            EVERGREEN FINANCIAL GUIDES
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {withoutRetired(FOUNDATIONS).map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 p-3.5 border-2 border-black/10 dark:border-slate-800 hover:border-black dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 rounded-xs transition-all hover:shadow-[4px_4px_0px_0px_rgba(200,16,46,1)]"
            >
              <span className="bg-black text-white font-mono text-xs font-black px-2 py-0.5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-sm font-black uppercase font-serif leading-tight text-black dark:text-white group-hover:text-[#c8102e] transition-colors">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#c8102e]">
                  <span>EXPLORE GUIDE</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
