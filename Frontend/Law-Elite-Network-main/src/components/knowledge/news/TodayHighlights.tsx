import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import type { CmsArticle } from "@/lib/cms";
import { resolveArticleImage } from "@/lib/article-art";
import { articleUrl } from "@/lib/article-url";

type Props = {
  articles: CmsArticle[];
};

/** Today's Highlights grid: thumbnail, reading time, author, views (only when known), category. */
export function TodayHighlights({ articles }: Props) {
  const items = articles.slice(0, 8);
  if (!items.length) return null;

  return (
    <section>
      <div className="section-rule">
        <span className="w-1.5 h-6 bg-news-600 rounded-sm" />
        <h2>Today&rsquo;s Highlights</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((article) => (
          <Link key={article.id} href={articleUrl(article)} className="group flex flex-col">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl mb-3 bg-slate-100 dark:bg-slate-800">
              <Image
                src={resolveArticleImage(article)}
                alt={article.title}
                fill
                loading="lazy"
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col flex-1 space-y-2">
              {article.category?.name && <span className="kicker">{article.category.name}</span>}
              <h3 className="font-headline text-sm font-bold leading-snug text-slate-900 dark:text-white line-clamp-3 group-hover:text-news-600 transition-colors">
                {article.title}
              </h3>
              <div className="mt-auto flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                {typeof article.views === "number" && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {article.views.toLocaleString()}
                  </span>
                )}
              </div>
              {article.author && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">By {article.author}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
