import React from "react";
import Link from "next/link";
import type { Article as LandingArticle } from "@/components/landing/investopedia/types";
import { HomeSectionHeading } from "./HomeSectionHeading";

type Props = {
  articles: LandingArticle[];
};

/**
 * "Popular Reads" — a headline-only, numbered rail (Outlook Money's
 * text-only "Popular" pattern), deliberately contrasted against the
 * image-rich sections above it. Sourced from `getHomeEditorial`'s dedup
 * pool, so it's always whatever's left after every other homepage section
 * has taken its picks — never a repeat headline, and never a fabricated
 * "trending by views" claim the site can't actually back with analytics.
 */
export function PopularReads({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Popular Reads" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8">
        {articles.map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-baseline gap-3 py-2.5 border-b border-border last:border-0 sm:last:border-b"
          >
            <span className="text-lg font-black text-primary/40 tabular-nums shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {a.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
