import Image from "next/image";
import Link from "next/link";
import { getCategoryArticles } from "@/services/data/cms-public";
import { getWorldDataLive } from "@/lib/data/worldFeed";
import { newsArticleHref } from "@/lib/data/article-url";
import { StoryLink } from "@/components/common/StoryLink";
import { getTopicColor } from "@/lib/topic-colors";
import { isPathHiddenByAdsenseCleanup } from "@/config/adsense-cleanup";

// Reuses the exact same live pipeline as imperialpedia.com/world (real wire
// news + admin-published CMS content, blended by getWorldDataLive). Renders
// with this article template's own light card styling rather than the
// <TrendingNow> component /world uses — that one's built for the dark
// ".world-shell" Imperialpedia theme (text-white/20 numbers, --imperialpedia-red hover), both
// invisible/wrong on a plain white sidebar card outside that shell.
export async function TrendingNowModule({ color = "#1d4fc4" }: { color?: string }) {
  try {
    const data = await getWorldDataLive("world");
    // During AdSense cleanup mode, world/news items are noindexed — don't surface
    // them in the sidebar of indexed pages.
    const items = data.latest
      .filter((item) => {
        const href = item.href ?? "";
        return !isPathHiddenByAdsenseCleanup(href);
      })
      .slice(0, 5);
    if (items.length === 0) return null;

    return (
      <div className="rounded-lg border border-border border-t-4 p-5" style={{ borderTopColor: color }}>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color }}>
          Trending Now
        </h2>
        <ol className="space-y-3">
          {items.map((item, i) => (
            <li key={item.id}>
              <StoryLink item={item} className="group flex items-start gap-3">
                <span className="w-4 shrink-0 text-lg font-black leading-none" style={{ color: `${color}4d` }}>
                  {i + 1}
                </span>
                <span className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {item.headline}
                </span>
              </StoryLink>
            </li>
          ))}
        </ol>
      </div>
    );
  } catch {
    return null;
  }
}

// "More in <Category>" — live CMS query scoped to any category slug (a topic
// like "politics", or a World geography node like "india"), same card shape
// as the rest of the article sidebar.
export async function MoreInCategoryModule({
  categorySlug,
  categoryLabel,
  excludeSlug,
}: {
  categorySlug?: string;
  categoryLabel: string;
  excludeSlug: string;
}) {
  if (!categorySlug) return null;
  try {
    const rawItems = await getCategoryArticles(categorySlug, 6).catch(() => []);
    const items = rawItems
      .filter((a) => a.slug !== excludeSlug)
      .filter((a) => !isPathHiddenByAdsenseCleanup(newsArticleHref(a)))
      .slice(0, 4);
    if (!items.length) return null;
    const color = getTopicColor(categoryLabel);

    return (
      <div className="rounded-lg border border-border border-t-4 p-5" style={{ borderTopColor: color }}>
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color }}>
          More in {categoryLabel}
        </h2>
        <ul className="space-y-4">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={newsArticleHref(a)} className="group flex gap-3">
                <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                  <Image src={a.imageUrl} alt={a.title} fill className="object-cover" sizes="64px" />
                </div>
                <span className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-3">
                  {a.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  } catch {
    return null;
  }
}
