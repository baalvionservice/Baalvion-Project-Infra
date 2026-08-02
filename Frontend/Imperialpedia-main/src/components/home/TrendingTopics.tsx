import React from "react";
import Link from "next/link";
import { getGlobalTopicIndexData } from "@/lib/data/topic-index";
import { getTermUrl } from "@/lib/data/utils";
import { HomeSectionHeading } from "./HomeSectionHeading";
import { GLOSSARY_LIVE } from "@/config/glossary";

/**
 * "Trending Topics" rail — reuses the glossary's real, content-derived
 * popularity ranking (`getGlobalTopicIndexData`) instead of a second
 * hand-picked term list, so this rail and /topics never disagree.
 */
export async function TrendingTopics() {
  // Glossary/topics surface is offline pending AdSense approval — see
  // src/config/glossary.ts. Nothing to link to, so render nothing.
  if (!GLOSSARY_LIVE) return null;

  const { topics, trending_topics } = await getGlobalTopicIndexData();
  if (trending_topics.length === 0) return null;

  const bySlug = new Map(topics.map((t) => [t.title, t.slug]));

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Trending Topics" href="/topics" />
      <div className="flex flex-wrap gap-3">
        {trending_topics.map((title) => {
          const slug = bySlug.get(title);
          if (!slug) return null;
          return (
            <Link
              key={slug}
              href={getTermUrl(slug)}
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {title}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default TrendingTopics;
