import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NewsArticle } from "@/lib/data.news";
import { CategoryBadge } from "@/components/pages/CategoriesBadge";
import { formatDate } from "@/services/format-date";
import { newsArticleHref } from "@/lib/data/article-url";

type Props = {
  article: NewsArticle;
};

/** Large CNN-style featured story: full-bleed image, big headline, dek, CTA. */
export function NewsHero({ article }: Props) {
  return (
    <Link href={newsArticleHref(article)} className="group block">
      <div className="relative w-full overflow-hidden rounded-2xl aspect-[16/9] lg:aspect-[21/9]">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8 space-y-3">
          <CategoryBadge category={article.category} />
          <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl group-hover:underline underline-offset-4 decoration-2">
            {article.title}
          </h1>
          <p className="hidden md:block text-white/85 text-base max-w-2xl line-clamp-2">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-3 pt-1 text-white/75 text-xs md:text-sm">
            <span>By {article.author.name}</span>
            <span aria-hidden>·</span>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </div>
          <span className="inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-white">
            Read More
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
