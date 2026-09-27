import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "./CategoriesBadge";
import { NewsArticle } from "@/lib/data.news";
import { formatDate } from "@/services/format-date";
import { newsArticleHref } from "@/lib/data/article-url";

/** Large hero card — the featured article */
export function FeaturedArticleCard({
  article,
  categoryLabel,
}: {
  article: NewsArticle;
  /** Overrides the badge text (e.g. the current topic page's title) without changing article.category. */
  categoryLabel?: string;
}) {
    return (
      <Link href={newsArticleHref(article)} className="group block">
        <div className="relative w-full md:mt-6 overflow-hidden aspect-[16/9] lg:aspect-[21/9]">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 75vw"
            priority
          />
        </div>
        {/* text */}
        <div className="py-5 space-y-3">
          <CategoryBadge category={article.category} label={categoryLabel} />
          <h3 className="text-foreground text-2xl md:text-3xl font-bold leading-snug max-w-2xl group-hover:underline underline-offset-4">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            By {article.author.name} <span aria-hidden="true">&middot;</span> {formatDate(article.publishedAt)}
          </p>
        </div>
      </Link>
    );
  }
