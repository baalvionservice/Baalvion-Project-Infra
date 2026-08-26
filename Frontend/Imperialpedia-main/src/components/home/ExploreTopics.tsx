import React from "react";
import Link from "next/link";
import { Wallet, LineChart, Globe2, Calculator, ArrowRight } from "lucide-react";
import { topicCopy } from "@/lib/topic-config";
import { getTopicColor } from "@/lib/topic-colors";
import { HomeSectionHeading } from "./HomeSectionHeading";

// Four top-level groups instead of six competing categories — Personal
// Finance, Budgeting, and Banking previously stood as separate top-level
// concepts even though budgeting and banking are naturally sub-topics of
// personal finance. Each group's subtitle names the concepts it actually
// covers so the grid stays useful without needing a link per concept.
const TOPICS = [
  {
    slug: "personal-finance",
    href: "/personal-finance",
    icon: Wallet,
    title: "Personal Finance",
    subtitle: "Budgeting · Saving · Credit · Debt · Loans · Banking · Retirement · Taxes",
  },
  {
    slug: "investing",
    href: "/investing",
    icon: LineChart,
    title: "Investing & Markets",
    subtitle: "Stocks · ETFs · Bonds · Mutual Funds · Portfolio Management · Options · Market Data",
  },
  {
    slug: "economy",
    href: "/economy",
    icon: Globe2,
    title: "Economics",
    subtitle: "Inflation · GDP · Employment · Interest Rates · Federal Reserve · Fiscal Policy · Monetary Policy",
  },
  {
    slug: "financial-tools",
    href: "/financial-tools",
    icon: Calculator,
    title: "Financial Tools",
    subtitle: "Calculators and educational tools",
  },
] as const;

// A cross-section of evergreen guide hubs (not the top-level categories above)
// surfaced as quick links, the same way TrendingTopics links out to glossary
// terms — except these routes always have real fallback content (see
// CategoryFeed's baked-snapshot/demo-content chain) regardless of CMS state.
const GUIDE_SLUGS = [
  "retirement",
  "emergency-fund",
  "budget-rules",
  "credit",
  "credit-cards",
  "mortgages",
  "student-loans",
  "cryptocurrency",
  "debt",
] as const;

/**
 * "Explore by Topic" — clear, always-rendering topic sections plus a row of
 * popular guide links. Unlike HomeEditorial/LatestArticles (which render
 * nothing until the CMS has published articles), this section links to hub
 * pages that already have real content through their own fallback chain, so
 * the homepage never collapses down to just Term of Day + newsletter.
 */
export function ExploreTopics() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Explore by Topic" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="mt-8 pt-6 border-t border-dashed border-border">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Popular Guides
        </h3>
        <div className="flex flex-wrap gap-x-1 gap-y-2 text-sm">
          {GUIDE_SLUGS.map((slug, i) => (
            <React.Fragment key={slug}>
              {i > 0 && <span className="text-muted-foreground px-1" aria-hidden>·</span>}
              <Link
                href={`/${slug}`}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {topicCopy(slug).title}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ExploreTopics;
