import Image from "next/image";
import Link from "next/link";
import { getCategoryArticles } from "@/services/data/cms-public";
import { getWorldDataLive } from "@/lib/data/worldFeed";
import { newsArticleHref } from "@/lib/data/article-url";
import TrendingNow from "@/components/world/TrendingNow";

// Reuses the exact same live pipeline as imperialpedia.com/world (real wire
// news + admin-published CMS content, blended by getWorldDataLive) and the
// same <TrendingNow> component that renders it there — so an article's
// sidebar and /world always show one real, live-fetched ranking, never a
// second static or CMS-only version that could drift from it.
export async function TrendingNowModule() {
  const data = await getWorldDataLive("world");
  return <TrendingNow latest={data.latest} />;
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
  const items = (await getCategoryArticles(categorySlug, 6)).filter((a) => a.slug !== excludeSlug).slice(0, 4);
  if (!items.length) return null;

  return (
    <div>
      <h2 className="text-xs font-black tracking-widest text-foreground uppercase border-b-2 border-border pb-2 mb-4">
        More in {categoryLabel}
      </h2>
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id}>
            <Link href={newsArticleHref(a)} className="group flex gap-3">
              <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                <Image src={a.imageUrl} alt={a.title} fill className="object-cover" sizes="64px" />
              </div>
              <span className="text-sm font-semibold text-foreground leading-snug group-hover:text-[#CC0000] transition-colors line-clamp-3">
                {a.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
