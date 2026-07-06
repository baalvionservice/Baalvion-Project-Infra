import Image from "next/image";
import Link from "next/link";
import type { NewsArticle } from "@/lib/data.news";
import { timeAgo } from "@/lib/utils/time-ago";

type Props = {
  articles: NewsArticle[];
};

/** Sidebar rail of trending headlines shown beside the hero. */
export function TrendingRail({ articles }: Props) {
  const items = articles.slice(0, 12);
  if (!items.length) return null;

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card">
      <h2 className="px-4 pt-4 pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Trending Now
      </h2>
      <ol className="divide-y divide-border">
        {items.map((article, i) => (
          <li key={article.id}>
            <Link
              href={`/${article.slug}`}
              className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <span className="w-5 shrink-0 text-lg font-bold text-muted-foreground/50">
                {i + 1}
              </span>
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={article.imageUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                  {article.category}
                </p>
                <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:underline">
                  {article.title}
                </h3>
                <p className="text-[11px] text-muted-foreground">{timeAgo(article.publishedAt)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
