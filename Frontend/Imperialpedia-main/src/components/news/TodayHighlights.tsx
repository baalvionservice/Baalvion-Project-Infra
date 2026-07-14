import Image from "next/image";
import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import type { NewsArticle } from "@/lib/data.news";
import { CategoryBadge } from "@/components/pages/CategoriesBadge";
import { newsArticleHref } from "@/lib/data/article-url";

type Props = {
  articles: NewsArticle[];
};

/** Today's Highlights grid: thumbnail, reading time, author, views (only when known), category. */
export function TodayHighlights({ articles }: Props) {
  const items = articles.slice(0, 8);
  if (!items.length) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        Today&rsquo;s Highlights
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((article) => (
          <Link key={article.id} href={newsArticleHref(article)} className="group flex flex-col">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl mb-3">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col flex-1 space-y-2">
              <CategoryBadge category={article.category} />
              <h3 className="text-sm font-bold leading-snug text-foreground line-clamp-3 group-hover:underline">
                {article.title}
              </h3>
              <div className="mt-auto flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {article.readTimeMinutes} min
                </span>
                {typeof article.views === "number" && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {article.views.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">By {article.author.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
