import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { NewsArticle } from "@/lib/data.news";
import { ArticleCard } from "@/app/news/NewsArticleCard";
import { formatDate } from "@/services/format-date";
import { newsArticleHref } from "@/lib/data/article-url";

type Props = {
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Already-claimed, deduped articles for this topic — [0] becomes the pillar highlight. */
  articles: NewsArticle[];
};

/**
 * Investopedia-style topic product section:
 * Header with "See all ->", 1 large lead guide on left, and 4 supporting article cards on right.
 */
export function ProductSection({ slug, label, icon: Icon, articles }: Props) {
  if (!articles.length) return null;
  const [pillar, ...supporting] = articles;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="flex items-center gap-2.5 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          <Icon className="h-5 w-5 text-primary" />
          {label}
        </h2>
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:underline"
        >
          See all in {label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pillar / Lead Guide */}
        <Link
          href={newsArticleHref(pillar)}
          className="group block space-y-3.5 lg:col-span-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/40"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={pillar.imageUrl}
              alt={pillar.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 33vw"
            />
          </div>
          <div className="space-y-2">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
              Lead Guide
            </span>
            <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {pillar.title}
            </h3>
            {pillar.excerpt && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {pillar.excerpt}
              </p>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              By {pillar.author.name} &middot; {formatDate(pillar.publishedAt)}
            </p>
          </div>
        </Link>

        {/* Supporting articles (2x2 grid) */}
        {supporting.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-8">
            {supporting.slice(0, 4).map((article) => (
              <ArticleCard key={article.id} article={article} categoryLabel={label} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
