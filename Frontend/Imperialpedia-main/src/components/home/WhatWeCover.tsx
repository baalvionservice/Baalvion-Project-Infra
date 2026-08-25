import React from "react";
import Link from "next/link";
import { Wallet, LineChart, BarChart3, Globe2, Calculator, ArrowRight } from "lucide-react";
import { HomeSectionHeading } from "./HomeSectionHeading";
import { getTopicColor } from "@/lib/topic-colors";

// Deliberately more granular than ExploreTopics' 4-group grid (Investing and
// Markets split back into two here) — this section exists to give a longer,
// paragraph-level topical map for readers and search engines, not to repeat
// the same short subtitle-line cards.
const COVERAGE = [
  {
    icon: Wallet,
    title: "Personal Finance",
    href: "/personal-finance",
    body: "Budgeting, saving, credit, debt, loans, mortgages, banking, retirement and taxes.",
  },
  {
    icon: LineChart,
    title: "Investing",
    href: "/investing",
    body: "Stocks, ETFs, mutual funds, bonds, portfolio construction, diversification and investment concepts.",
  },
  {
    icon: BarChart3,
    title: "Markets",
    href: "/markets",
    body: "Market data, trading concepts, market indicators, earnings, commodities and major financial benchmarks.",
  },
  {
    icon: Globe2,
    title: "Economics",
    href: "/economy",
    body: "Inflation, GDP, employment, interest rates, monetary policy, fiscal policy and economic cycles.",
  },
  {
    icon: Calculator,
    title: "Financial Tools",
    href: "/financial-tools",
    body: "Calculators and educational tools that help readers understand financial decisions.",
  },
] as const;

/**
 * "What We Cover" — a longer, paragraph-level topical map distinct from
 * ExploreTopics' short-subtitle card grid, giving both readers and search
 * engines a clearer sense of scope per subject area.
 */
export function WhatWeCover() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="What We Cover" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {COVERAGE.map(({ icon: Icon, title, href, body }) => {
          const color = getTopicColor(href.replace("/", ""));
          return (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-lg p-4 -m-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-background hover:shadow-md"
            >
              <Icon className="h-6 w-6" style={{ color }} aria-hidden />
              <span className="mt-3 flex items-center gap-1 text-base font-bold text-foreground transition-colors">
                {title}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default WhatWeCover;
