"use client";

import Link from "next/link";
import { useState } from "react";
import type { CmsArticle } from "@/lib/cms";

type Props = {
  articles: CmsArticle[];
};

/**
 * Ticker item priority: editorially-flagged `customFields.breaking` items first,
 * then `featured` items, then most-recently-published — so it degrades gracefully
 * without requiring the CMS to add a dedicated field before this ships.
 */
function pickBreaking(articles: CmsArticle[]): CmsArticle[] {
  const breaking = articles.filter((a) => a.customFields?.breaking === true);
  if (breaking.length) return breaking.slice(0, 10);
  const featured = articles.filter((a) => a.featured);
  if (featured.length) return featured.slice(0, 10);
  return [...articles]
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
    .slice(0, 8);
}

export function BreakingTicker({ articles }: Props) {
  const [paused, setPaused] = useState(false);
  const items = pickBreaking(articles);

  if (!items.length) return null;

  return (
    <div
      className="sticky top-0 z-40 flex items-stretch bg-news-600 text-white dark:bg-news-700"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-widest bg-news-700 dark:bg-news-800">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
        Breaking
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div
          className="flex whitespace-nowrap py-2 [animation:le-ticker_35s_linear_infinite]"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {[...items, ...items].map((article, i) => (
            <Link
              key={`${article.id}-${i}`}
              href={`/article/${article.slug}`}
              className="mx-6 font-headline text-sm font-semibold hover:underline underline-offset-4"
            >
              {article.title}
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes le-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
