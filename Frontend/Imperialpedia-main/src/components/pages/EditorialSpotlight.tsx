import Image from "next/image";
import Link from "next/link";
import type { NewsArticle } from "@/lib/data.news";
import { newsArticleHref } from "@/lib/data/article-url";

interface EditorialSpotlightProps {
  badgeLabel?: string;
  featured?: NewsArticle;
  sidebarArticles: NewsArticle[];
  categoryLabel?: string;
  layout?: "left" | "right";
}

/**
 * Imperialpedia Style 5-Post Lead Spotlight:
 * Featured story on the left/right in a heavy Imperialpedia black box frame,
 * accompanied by numbered sidebar stories with red rank badges.
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
    <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)] relative rounded-xs">
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
      
      <Link href={newsArticleHref(featured)} className="group block space-y-4 pt-1">
        <div className="relative aspect-[16/10] w-full overflow-hidden border-2 border-black dark:border-slate-700 bg-muted">
          <Image
            src={featured.imageUrl}
            alt={featured.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
              LEAD STORY
            </span>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#c8102e]">
              // {categoryLabel ?? featured.category}
            </p>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-black dark:text-white leading-tight font-serif uppercase group-hover:text-[#c8102e] transition-colors">
            {featured.title}
          </h3>

          {featured.excerpt && (
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium line-clamp-3">
              {featured.excerpt}
            </p>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
            <span>By <strong className="text-black dark:text-white uppercase font-serif">{featured.author.name}</strong></span>
            <span className="text-[#c8102e] uppercase">READ FULL STORY →</span>
          </div>
        </div>
      </Link>
    </div>
  );

  const sidebarList = sidebarArticles.length > 0 && (
    <div className="space-y-4">
      {sidebarArticles.slice(0, 4).map((article, idx) => (
        <Link
          key={article.id}
          href={newsArticleHref(article)}
          className="group flex gap-4 items-center bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all relative"
        >
          {/* Thumbnail */}
          <div className="relative h-20 w-28 sm:h-24 sm:w-32 shrink-0 overflow-hidden border-2 border-black dark:border-slate-700 bg-muted">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="128px"
            />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[#c8102e] font-mono font-black text-xs">
                0{idx + 1}.
              </span>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                {categoryLabel ?? article.category}
              </p>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-black dark:text-white leading-snug line-clamp-2 uppercase group-hover:text-[#c8102e] transition-colors">
              {article.title}
            </h4>
            <p className="text-[11px] font-mono text-slate-500">
              By {article.author.name}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <section className="space-y-6 my-6">
      {badgeLabel && (
        <div className="flex items-center gap-2 border-b-4 border-black dark:border-slate-700 pb-3">
          <span className="bg-[#c8102e] text-white text-xs font-black uppercase tracking-widest px-3 py-1 -skew-x-12">
            IMPERIALPEDIA
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-black dark:text-white font-mono">
            {badgeLabel}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
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
