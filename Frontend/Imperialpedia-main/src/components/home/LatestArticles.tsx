import React from "react";
import Link from "next/link";
import Image from "next/image";
import { articleArtDataUri } from "@baalvion/illustrations";
import { getArticles } from "@/modules/content-engine/services/content-service";
import { newsArticleHref } from "@/lib/data/article-url";
import { HomeSectionHeading } from "./HomeSectionHeading";

const LATEST_COUNT = 4;

/**
 * Real "Latest Articles" rail — sourced from the CMS-backed article service
 * (falls back to the legacy mock set only when the CMS has nothing published
 * yet), unlike the rest of the homepage which was 100% hardcoded editorial
 * copy. Async Server Component so it streams independently inside its own
 * Suspense boundary rather than blocking the rest of the page.
 */
export async function LatestArticles() {
  const { data: articles } = await getArticles(1, LATEST_COUNT);
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading title="Latest Articles" href="/financial-intelligence" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => {
          const href = newsArticleHref({
            slug: article.slug,
            publishedAt: article.publishedAt || article.updatedAt,
            contentType: article.contentType,
            categorySlug: article.categorySlug,
          });
          const img =
            article.featuredImage ||
            articleArtDataUri({ title: article.title, category: article.category, seed: article.slug });

          return (
            <Link key={article.id} href={href} className="group block">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="pt-3">
                <span className="eyebrow">{article.category}</span>
                <h3 className="mt-1 text-lg font-bold leading-tight text-foreground group-hover:text-primary line-clamp-3">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                    {article.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default LatestArticles;
