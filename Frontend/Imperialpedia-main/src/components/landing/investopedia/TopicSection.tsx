import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TopicGroup } from "./types";
import { ArticleCard } from "./ArticleCard";

/**
 * A topic row: section heading with accent rule + a responsive grid of cards.
 * The repeated building block of the Investopedia homepage body.
 */
export function TopicSection({ group }: { group: TopicGroup }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <div className="flex items-end justify-between mb-5">
        <h2 className="flex items-center text-xl font-black uppercase tracking-tight text-foreground">
          <span className="mr-3 h-5 w-1.5 bg-accent" aria-hidden />
          {group.title}
        </h2>
        <Link
          href={group.href}
          className="group inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline underline-offset-2"
        >
          More
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {group.articles.map((a) => (
          <ArticleCard key={a.href + a.title} article={a} />
        ))}
      </div>
    </section>
  );
}

export default TopicSection;
