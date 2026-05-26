import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "./CategoriesBadge";
import { NewsArticle } from "@/lib/data.news";

/** Horizontal card (image left, text right) — for the sidebar list */
export function HorizontalArticleCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/${article.slug}`}
      className="group flex gap-3 items-center py-4 border-b border-gray-100 last:border-none"
    >
      <div className="relative flex-shrink-0 w-32 h-full overflow-hidden">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105"
          sizes="96px"
        />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <CategoryBadge category={article.category} />
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
