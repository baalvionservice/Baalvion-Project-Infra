import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "./CategoriesBadge";
import { NewsArticle } from "@/lib/data.news";
import { formatDate } from "@/services/format-date";
import { newsArticleHref } from "@/lib/data/article-url";

/** Large hero card — the featured article */
export function FeaturedArticleCard({ article }: { article: NewsArticle }) {
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
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
        {/* text */}
        <div className="py-5 space-y-3">
          <CategoryBadge category={article.category} />
          <h3 className="text-foreground text-2xl md:text-3xl font-bold leading-snug max-w-2xl group-hover:underline underline-offset-4">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="max-w-2xl text-sm text-gray-600 leading-relaxed line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <p className="text-gray-500 text-xs">
            By {article.author.name} · {formatDate(article.publishedAt)} · {article.readTimeMinutes} min read
          </p>
        </div>
      </Link>
    );
  }