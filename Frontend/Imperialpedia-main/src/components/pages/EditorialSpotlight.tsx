import Image from "next/image";
import Link from "next/link";
import type { NewsArticle } from "@/lib/data.news";
import { newsArticleHref } from "@/lib/data/article-url";
import { formatDate } from "@/services/format-date";

interface EditorialSpotlightProps {
  badgeLabel?: string;
  featured?: NewsArticle;
  sidebarArticles: NewsArticle[];
  categoryLabel?: string;
  layout?: "left" | "right";
}

/**
 * Exact Investopedia 5-Post Spotlight component (matching screenshots 2, 4, 5):
 * Supports both standard (Featured Left, 4 stories Right) and reversed (4 stories Left, Featured Right).
 */
export function EditorialSpotlight({
  badgeLabel,
  featured,
  sidebarArticles,
  categoryLabel,
  layout = "left",
}: EditorialSpotlightProps) {
  if (!featured && sidebarArticles.length === 0) return null;

  const leadCard = featured && (
    <div className="space-y-4">
      <Link href={newsArticleHref(featured)} className="group block space-y-3.5">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <Image
            src={featured.imageUrl}
            alt={featured.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-102"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#1d4fc4]">
            {categoryLabel ?? featured.category}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#1d4fc4] leading-snug hover:underline">
            {featured.title}
          </h3>
          {featured.excerpt && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
              {featured.excerpt}
            </p>
          )}
          <p className="text-xs text-muted-foreground pt-1">
            By <span className="text-foreground font-medium">{featured.author.name}</span>
          </p>
        </div>
      </Link>
    </div>
  );

  const sidebarList = sidebarArticles.length > 0 && (
    <div className="space-y-6">
      {sidebarArticles.slice(0, 4).map((article) => (
        <Link
          key={article.id}
          href={newsArticleHref(article)}
          className="group flex gap-4 items-start"
        >
          {/* Square/Landscape Thumbnail Image */}
          <div className="relative h-20 w-28 sm:h-24 sm:w-36 flex-shrink-0 overflow-hidden bg-muted">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="144px"
            />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1d4fc4]">
              {categoryLabel ?? article.category}
            </p>
            <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-[#1d4fc4] transition-colors">
              {article.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              By {article.author.name}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <section className="space-y-6 my-4">
      {badgeLabel && (
        <div>
          <span className="inline-block bg-gray-100 dark:bg-muted text-gray-800 dark:text-gray-200 text-xs font-bold uppercase tracking-widest px-3 py-1">
            {badgeLabel}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {layout === "left" ? (
          <>
            <div className="lg:col-span-7">{leadCard}</div>
            <div className="lg:col-span-5">{sidebarList}</div>
          </>
        ) : (
          <>
            <div className="lg:col-span-5 order-2 lg:order-1">{sidebarList}</div>
            <div className="lg:col-span-7 order-1 lg:order-2">{leadCard}</div>
          </>
        )}
      </div>
    </section>
  );
}
