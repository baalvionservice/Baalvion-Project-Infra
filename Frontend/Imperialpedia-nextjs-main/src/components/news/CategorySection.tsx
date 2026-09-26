import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NewsArticle, NewsCategory } from "@/lib/data.news";
import { CATEGORY_TOPIC_SLUG } from "@/lib/utils/category-topic-slug";
import { formatDate } from "@/services/format-date";
import { newsArticleHref } from "@/lib/data/article-url";

type Props = {
  category: NewsCategory;
  articles: NewsArticle[];
};

const CATEGORY_LABEL: Record<NewsCategory, string> = {
  Markets: "Markets",
  Economy: "Economy",
  Stocks: "Stocks & Company News",
  Crypto: "Cryptocurrency",
  PersonalFinance: "Personal Finance",
  RealEstate: "Real Estate",
  ETFs: "ETFs",
  Bonds: "Bonds & Fixed Income",
  Guides: "Guides",
  Editorial: "Editorial",
  Business: "Business",
  Investing: "Investing",
  Tech: "Technology",
  Politics: "Politics",
  World: "World",
  Finance: "Finance",
  HealthScience: "Health & Science",
  Media: "Media",
  Energy: "Energy",
  Climate: "Climate",
};

/** One finance-niche category rail: a large feature plus 4-6 smaller stories. */
export function CategorySection({ category, articles }: Props) {
  if (!articles.length) return null;
  const [feature, ...rest] = articles;
  const small = rest.slice(0, 6);
  const topicSlug = CATEGORY_TOPIC_SLUG[category];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-red-600 pb-2">
        <h2 className="text-lg font-bold text-foreground">{CATEGORY_LABEL[category]}</h2>
        {topicSlug && (
          <Link
            href={`/${topicSlug}`}
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-red-600 hover:underline dark:text-red-400"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Link href={newsArticleHref(feature)} className="group lg:col-span-1 block">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
            <Image
              src={feature.imageUrl}
              alt={feature.title}
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <h3 className="mt-3 text-base font-bold leading-snug text-foreground group-hover:underline line-clamp-3">
            {feature.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(feature.publishedAt)}</p>
        </Link>

        {small.length > 0 && (
          <ul className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {small.map((article) => (
              <li key={article.id}>
                <Link href={newsArticleHref(article)} className="group flex gap-3">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={article.imageUrl}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-sm font-semibold leading-snug text-foreground group-hover:underline line-clamp-3">
                    {article.title}
                  </h4>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
