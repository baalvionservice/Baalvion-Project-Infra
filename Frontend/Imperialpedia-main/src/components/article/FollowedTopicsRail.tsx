"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getFollowedTopics } from "@/lib/followed-topics";
import { getTopicColor } from "@/lib/topic-colors";
import { newsArticleHref } from "@/lib/data/article-url";

interface TopicArticle {
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  contentType?: string;
  publishedAt: string;
}

/** Client-side (localStorage-driven) — shows real articles from whatever topics
 *  this browser has followed, excluding the article currently being read.
 *  Renders nothing until there's at least one followed topic with results. */
export function FollowedTopicsRail({ excludeSlug }: { excludeSlug: string }) {
  const [articles, setArticles] = useState<TopicArticle[] | null>(null);

  useEffect(() => {
    const topics = getFollowedTopics();
    if (topics.length === 0) {
      setArticles([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      topics.map((slug) =>
        fetch(`/api/topic-articles/${encodeURIComponent(slug)}`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []),
      ),
    ).then((results: TopicArticle[][]) => {
      if (cancelled) return;
      const seen = new Set<string>([excludeSlug]);
      const merged: TopicArticle[] = [];
      for (const list of results) {
        for (const a of list) {
          if (seen.has(a.slug)) continue;
          seen.add(a.slug);
          merged.push(a);
        }
      }
      setArticles(merged.slice(0, 5));
    });
    return () => {
      cancelled = true;
    };
  }, [excludeSlug]);

  if (!articles?.length) return null;

  return (
    <div className="rounded-lg border border-border p-5">
      <h2 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        From topics you follow
      </h2>
      <ul className="space-y-3">
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={newsArticleHref(a)} className="group block">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: getTopicColor(a.category) }}>
                {a.category}
              </span>
              <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">{a.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
