import React from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

type Term = { label: string; href: string };

const DEFAULT_TERMS: Term[] = [
  { label: "Inflation", href: "/inflation" },
  { label: "S&P 500", href: "/stocks" },
  { label: "Roth IRA", href: "/retirement" },
  { label: "ETF", href: "/etfs" },
  { label: "Interest Rates", href: "/interest-rates" },
  { label: "Bitcoin", href: "/cryptocurrency" },
  { label: "Recession", href: "/economy" },
  { label: "Dividend", href: "/glossary" },
  { label: "Federal Reserve", href: "/fed" },
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

export default TrendingBar;
