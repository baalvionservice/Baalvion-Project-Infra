import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "./CategoriesBadge";
import { NewsArticle } from "@/lib/data.news";
import { newsArticleHref } from "@/lib/data/article-url";

/** Horizontal card (image left, text right) — for the sidebar list */
export function HorizontalArticleCard({
  article,
  categoryLabel,
}: {
  article: NewsArticle;
  /** Overrides the badge text (e.g. the current topic page's title) without changing article.category. */
  categoryLabel?: string;
}) {
  return (
    <Link
      href={newsArticleHref(article)}
      className="group flex gap-3 items-center py-4 border-b border-border last:border-none"
    >
      <div className="relative flex-shrink-0 w-24 h-20 overflow-hidden rounded-sm">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105"
          sizes="96px"
        />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <CategoryBadge category={article.category} label={categoryLabel} />
        <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:underline line-clamp-2">
          {article.title}
        </h3>
        <div className="text-foreground text-sm">
          By <span className="">{article.author.name}</span>
        </div>
      </div>
    </Link>
  );
}
