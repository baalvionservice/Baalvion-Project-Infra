import React from "react";
import { getArticles } from "@/modules/content-engine/services/content-service";
import { getAuthorBySlug } from "@/config/authors";
import { newsArticleHref } from "@/lib/data/article-url";
import { articleArtDataUri } from "@baalvion/illustrations";
import { ArticleCard } from "./ArticleCard";
import { HomeSectionHeading } from "./HomeSectionHeading";

const LATEST_COUNT = 6;
const WORDS_PER_MINUTE = 200;
const MIN_READING_TIME = 1;

function calculateReadingTime(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(MIN_READING_TIME, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

const defaultAuthor = {
  name: "Imperialpedia Editorial Team",
  profileUrl: "/about",
  credentials: "Editorial Team",
};

/**
 * "Latest Articles" rail with full YMYL/E-E-A-T signals: author byline (drawn
 * from the same editorial author registry used by article bylines site-wide,
 * not a duplicated list), publication/last-updated dates, and reading time.
 * Sourced from the CMS-backed article service, matching the rest of the site.
 */
export async function LatestArticlesRefactored() {
  const { data: articles } = await getArticles(1, LATEST_COUNT);
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
      <div className="mb-8">
        <HomeSectionHeading title="Latest Articles" href="/financial-intelligence" />
        <p className="text-sm text-muted-foreground mt-2">
          Expert analysis and market insights from our team of seasoned financial professionals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => {
          const registryAuthor = article.authorSlug
            ? getAuthorBySlug(article.authorSlug)
            : undefined;

          const author = registryAuthor
            ? {
                name: registryAuthor.name,
                profileUrl: `/authors/${registryAuthor.slug}`,
                credentials: registryAuthor.credentials || registryAuthor.title,
              }
            : defaultAuthor;

          const href = newsArticleHref({
            slug: article.slug,
            publishedAt: article.publishedAt || article.updatedAt,
            contentType: article.contentType,
            categorySlug: article.categorySlug,
          });

          const featuredImage =
            article.featuredImage ||
            articleArtDataUri({
              title: article.title,
              category: article.category,
              seed: article.slug,
            });

          const readingTime =
            article.readingTime && article.readingTime > 0
              ? article.readingTime
              : calculateReadingTime(article.description || article.title || "");

          return (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              description={article.description}
              category={article.category}
              featuredImage={featuredImage}
              href={href}
              author={author}
              publishedAt={
                article.publishedAt ? new Date(article.publishedAt) : new Date()
              }
              updatedAt={
                article.updatedAt ? new Date(article.updatedAt) : new Date()
              }
              readingTimeMinutes={readingTime}
            />
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <a
          href="/financial-intelligence"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View All Articles
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

export default LatestArticlesRefactored;
