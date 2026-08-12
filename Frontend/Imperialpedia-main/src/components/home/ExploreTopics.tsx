import React from "react";
import Link from "next/link";
import { TrendingUp, Wallet, PiggyBank, Landmark, Globe2, Newspaper, ArrowRight } from "lucide-react";
import { topicCopy } from "@/lib/topic-config";
import { HomeSectionHeading } from "./HomeSectionHeading";

// The site's top-level nav categories (mirrors CATEGORY_GROUPS in topic-config.ts).
// Titles/descriptions are pulled from topicCopy — the same source each hub page's
// own H1/hero uses — rather than duplicated here, so this grid can't drift from
// what /investing, /budgeting, etc. actually say.
const TOPICS = [
  { slug: "investing", href: "/investing", icon: TrendingUp },
  { slug: "personal-finance", href: "/personal-finance", icon: Wallet },
  { slug: "budgeting", href: "/budgeting", icon: PiggyBank },
  { slug: "banking", href: "/banking", icon: Landmark },
  { slug: "economy", href: "/economy", icon: Globe2 },
  { slug: "market-news", href: "/market-news", icon: Newspaper },
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
  "taxes",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOPICS.map(({ slug, href, icon: Icon }) => {
          const { title, description } = topicCopy(slug);
          return (
            <Link
              key={slug}
              href={href}
              className="group flex flex-col rounded-lg border border-border p-5 hover:border-primary transition-colors"
            >
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              <span className="mt-4 flex items-center gap-1 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {title}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{description}</p>
            </Link>
          );
        })}
      </div>

      <h3 className="mt-8 mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Popular Guides
      </h3>
      <div className="flex flex-wrap gap-3">
        {GUIDE_SLUGS.map((slug) => (
          <Link
            key={slug}
            href={`/${slug}`}
            className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            {topicCopy(slug).title}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ExploreTopics;
