"use client";

import Link from "next/link";
import { useState } from "react";
import type { NewsArticle } from "@/lib/data.news";

type Props = {
  articles: NewsArticle[];
};

/**
 * Ticker item priority: editorially-flagged `customFields.breaking` items first,
 * then `featured` items, then most-recently-published — so it degrades gracefully
 * without requiring the CMS to add a dedicated field before this ships.
 */
function pickBreaking(articles: NewsArticle[]): NewsArticle[] {
  const breaking = articles.filter((a) => a.customFields?.breaking === true);
  if (breaking.length) return breaking.slice(0, 10);
  const featured = articles.filter((a) => a.featured);
  if (featured.length) return featured.slice(0, 10);
  return [...articles]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 8);
}

export function BreakingTicker({ articles }: Props) {
  const [paused, setPaused] = useState(false);
  const items = pickBreaking(articles);

  if (!items.length) return null;

  return (
    <div
      className="sticky top-0 z-40 flex items-stretch bg-red-600 text-white dark:bg-red-700"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest bg-red-700 dark:bg-red-800">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        Breaking
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex whitespace-nowrap py-2 [animation:ticker_35s_linear_infinite]"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {[...items, ...items].map((article, i) => (
            <Link
              key={`${article.id}-${i}`}
              href={`/${article.slug}`}
              className="mx-6 text-sm font-medium hover:underline underline-offset-4"
            >
              {article.title}
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
