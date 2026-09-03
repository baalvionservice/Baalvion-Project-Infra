import React from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

type Term = { label: string; href: string };

// 2026-09-04: 7 of these 8 used to point at categories retired pending
// AdSense review (see next.config.ts) — Inflation, Roth IRA, ETF, Interest
// Rates, Bitcoin, Recession, and Federal Reserve all 301 to / now. Trimmed to
// terms that actually resolve to live content; expand again as categories are
// rewritten and republished, not before.
const DEFAULT_TERMS: Term[] = [
  { label: "Stocks", href: "/stocks" },
  { label: "Dividend Yield", href: "/stocks/dividend-yield-explained" },
  { label: "Budgeting", href: "/budgeting-basics" },
  { label: "Compound Interest", href: "/financial-tools/compound-interest" },
];

/**
 * Investopedia-style "Trending" ticker bar of hot terms beneath the header.
 */
export function TrendingBar({ terms = DEFAULT_TERMS }: { terms?: Term[] }) {
  return (
    <div className="border-b border-border bg-secondary/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-11 overflow-x-auto scrollbar-hide">
          <span className="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-bold uppercase tracking-wider text-primary">
            <TrendingUp className="h-3.5 w-3.5" /> Trending
          </span>
          <ul className="flex items-center gap-4">
            {terms.map((t) => (
              <li key={t.href + t.label} className="flex-shrink-0">
                <Link
                  href={t.href}
                  className="text-[13px] font-medium text-foreground whitespace-nowrap hover:text-primary hover:underline underline-offset-2"
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
