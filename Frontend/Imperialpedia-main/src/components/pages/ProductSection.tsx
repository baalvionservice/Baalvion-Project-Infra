import Link from "next/link";
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
 * One topic section shared by the Banking and Personal Finance hubs — a
 * pillar-guide highlight (the topic's strongest real, live article) plus a
 * supporting-articles grid. The pillar slot is a content-strategy label, not
 * a stand-in for an article that doesn't exist yet — it always points at
 * whatever real piece currently leads that category, so nothing here is a
 * fabricated link.
 */
export function ProductSection({ slug, label, icon: Icon, articles }: Props) {
  if (!articles.length) return null;
  const [pillar, ...supporting] = articles;

  return (
    <section>
      <div className="flex items-center justify-between mb-6 pb-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400">
          <Icon className="h-4 w-4" />
          {label}
        </h2>
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary"
        >
          See all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Link
          href={newsArticleHref(pillar)}
          className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50 p-6 lg:col-span-1"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Pillar Guide</p>
            <h3 className="text-lg font-bold text-foreground leading-snug group-hover:underline">
              {pillar.title}
            </h3>
            {pillar.excerpt && (
              <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-3">{pillar.excerpt}</p>
            )}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            {formatDate(pillar.publishedAt)} &middot; {pillar.readTimeMinutes} min read
          </p>
        </Link>

        {supporting.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:col-span-2">
            {supporting.slice(0, 4).map((article) => (
              <ArticleCard key={article.id} article={article} categoryLabel={label} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductSection;
