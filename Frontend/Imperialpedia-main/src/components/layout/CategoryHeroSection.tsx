import Image from "next/image";
import Link from "next/link";
import type { NewsArticle } from "@/lib/data.news";
import { newsArticleHref } from "@/lib/data/article-url";
import { CategoryBadge } from "@/components/pages/CategoriesBadge";
import { formatDate } from "@/services/format-date";

type Pill = { label: string; href: string };
type BannerStat = {
  label: string;
  value: string;
  trend?: "up" | "down" | "neutral";
};

interface CategoryHeroSectionProps {
  title: string;
  description: string;
  eyebrow?: { label: string; href: string };
  featured?: NewsArticle;
  pills?: Pill[];
  totalGuides?: number;
  banner?: BannerStat[];
}

/**
 * Premium split-hero for category pages.
 * Left: title + description + pills + live stats.
 * Right: featured article as a full image card with gradient text overlay.
 * Below: thin gradient context-stat banner.
 */
export default function CategoryHeroSection({
  title,
  description,
  eyebrow,
  featured,
  pills = [],
  totalGuides,
  banner = [],
}: CategoryHeroSectionProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Subtle radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 20%, hsl(var(--primary)/0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 pt-12 lg:pt-16">
        <div
          className={`grid gap-8 lg:gap-12 items-center ${
            featured ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-3xl"
          }`}
        >
          {/* LEFT: Text panel */}
          <div className="space-y-6">
            {eyebrow && (
              <Link
                href={eyebrow.href}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                ← {eyebrow.label}
              </Link>
            )}

            <div>
              <h1 className="text-5xl lg:text-[3.75rem] font-extrabold tracking-tight text-foreground leading-[1.05]">
                {title}
              </h1>
              <p className="mt-4 text-base lg:text-lg text-muted-foreground leading-relaxed max-w-lg">
                {description}
              </p>
            </div>

            {/* Quick-access topic pills */}
            {pills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pills.map((pill) => (
                  <Link
                    key={pill.href}
                    href={pill.href}
                    className="inline-flex items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all duration-150 hover:border-primary hover:text-primary hover:bg-primary/5 hover:shadow-sm"
                  >
                    {pill.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Animated stats row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              {totalGuides !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-sm font-extrabold text-foreground">{totalGuides}+</span>
                  <span className="text-xs text-muted-foreground">Guides</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm font-extrabold text-foreground">Daily</span>
                <span className="text-xs text-muted-foreground">Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-sm font-extrabold text-foreground">Expert</span>
                <span className="text-xs text-muted-foreground">Reviewed</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Featured article card */}
          {featured && (
            <Link
              href={newsArticleHref(featured)}
              className="group relative block overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/5"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={featured.imageUrl}
                  alt={featured.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5" />
              </div>

              {/* Text overlay on image */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <CategoryBadge category={featured.category} />
                <h2 className="mt-2 text-xl lg:text-2xl font-bold text-white leading-snug line-clamp-3 group-hover:underline underline-offset-2 decoration-white/60">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-1.5 text-sm text-white/70 line-clamp-2 hidden sm:block">
                    {featured.excerpt}
                  </p>
                )}
                <p className="mt-3 text-xs text-white/60">
                  By {featured.author.name} &middot; {formatDate(featured.publishedAt)}
                </p>
              </div>

              {/* Featured badge */}
              <div className="absolute top-4 right-4 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground shadow-lg">
                Featured
              </div>
            </Link>
          )}
        </div>

        {/* Context banner */}
        {banner.length > 0 && (
          <div className="mt-10 rounded-xl bg-gradient-to-r from-primary/[0.08] via-primary/[0.05] to-transparent border border-primary/10 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              {banner.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    {item.label}:
                  </span>
                  <span
                    className={`font-bold whitespace-nowrap ${
                      item.trend === "up"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : item.trend === "down"
                        ? "text-red-500 dark:text-red-400"
                        : "text-foreground"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
              <span className="ml-auto hidden sm:inline text-[10px] text-muted-foreground/50 italic">
                For informational context only
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom divider */}
      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}
