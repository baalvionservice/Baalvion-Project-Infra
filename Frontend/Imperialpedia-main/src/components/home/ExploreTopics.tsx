import Link from "next/link";
import { Wallet, LineChart, Calculator, ArrowRight } from "lucide-react";
import { getTopicColor } from "@/lib/topic-colors";
import { HomeSectionHeading } from "./HomeSectionHeading";

// 2026-09-04: was 4 tiles (Personal Finance, Investing & Markets, Economics,
// Financial Tools) plus a 9-link "Popular Guides" row. 46+8 categories were
// retired pending AdSense review (see next.config.ts) and every one of those
// tiles/links pointed at a category that now 301s to / — including "Popular
// Guides", which has been dropped rather than refilled, since a curated list
// of category-hub links doesn't fit a 2-category site without padding it back
// out with the same dead links. Down to the 3 destinations that are actually
// live: Stocks, Budgeting, and the Financial Tools calculators (never a
// category, unaffected by any of this). Add tiles back as categories are
// rewritten and republished, not before.
const TOPICS = [
  {
    slug: "stocks",
    href: "/stocks",
    icon: LineChart,
    title: "Stocks",
    subtitle: "How stocks work, valuation ratios, trading mechanics, and reading a market move.",
  },
  {
    slug: "budgeting-basics",
    href: "/budgeting-basics",
    icon: Wallet,
    title: "Budgeting",
    subtitle: "Budgeting methods, saving strategies, and money management for real life.",
  },
  {
    slug: "financial-tools",
    href: "/financial-tools",
    icon: Calculator,
    title: "Financial Tools",
    subtitle: "Calculators and educational tools.",
  },
] as const;

/**
 * "Explore by Topic" — clear, always-rendering topic sections. Unlike
 * HomeEditorial/LatestArticles (which render nothing until the CMS has
 * published articles), this section links to hub pages that already have
 * real content, so the homepage never collapses down to just Term of Day +
 * newsletter.
 */
export function ExploreTopics() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Explore by Topic" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOPICS.map(({ slug, href, icon: Icon, title, subtitle }) => {
          const color = getTopicColor(slug);
          return (
            <Link
              key={slug}
              href={href}
              className="group flex flex-col rounded-lg border border-border border-t-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderTopColor: color }}
            >
              <Icon className="h-6 w-6" style={{ color }} aria-hidden />
              <span className="mt-4 flex items-center gap-1 text-base font-bold text-foreground transition-colors">
                {title}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
