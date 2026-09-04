import Link from "next/link";
import { Wallet, LineChart, Calculator, ShieldAlert, ArrowRight } from "lucide-react";
import { getTopicColor } from "@/lib/topic-colors";
import { getCategoryDirectory } from "@/services/data/cms-public";
import { HomeSectionHeading } from "./HomeSectionHeading";

// 2026-09-04: was 4 tiles (Personal Finance, Investing & Markets, Economics,
// Financial Tools) plus a 9-link "Popular Guides" row. 46+8 categories were
// retired pending AdSense review (see next.config.ts) and every one of those
// tiles/links pointed at a category that now 301s to / — including "Popular
// Guides", which has been dropped rather than refilled, since a curated list
// of category-hub links doesn't fit a small site without padding it back out
// with the same dead links. Down to the destinations that are actually live.
// Article counts are fetched live (getCategoryDirectory, the same source
// AllCategories uses) rather than hardcoded, so this never drifts stale.
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
    slug: "fraud-protection",
    href: "/fraud-protection",
    icon: ShieldAlert,
    title: "Scams & Fraud Protection",
    subtitle: "How scammers actually operate, and the concrete steps that stop them.",
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
 * newsletter. Article counts are real (live CMS count), never a placeholder.
 */
export async function ExploreTopics() {
  const directory = await getCategoryDirectory().catch(() => []);
  const countBySlug = new Map(directory.map((d) => [d.slug, d.articleCount]));

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
      <HomeSectionHeading title="Explore by Topic" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {TOPICS.map(({ slug, href, icon: Icon, title, subtitle }) => {
          const color = getTopicColor(slug);
          const count = countBySlug.get(slug);
          return (
            <Link
              key={slug}
              href={href}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
              style={{ borderTopWidth: 4, borderTopColor: color }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${color}1a` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} aria-hidden />
                </span>
                {typeof count === "number" && count > 0 && (
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {count} {count === 1 ? "article" : "articles"}
                  </span>
                )}
              </div>
              <span className="mt-5 flex items-center gap-1 text-lg font-headline font-bold text-foreground transition-colors">
                {title}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
