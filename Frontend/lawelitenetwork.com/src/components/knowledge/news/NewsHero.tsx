import type { CmsArticle } from "@/lib/cms";
import { StoryCard } from "./StoryCard";
import { LatestRail } from "./LatestRail";

type Props = {
  lead: CmsArticle;
  trending: CmsArticle[];
};

/** Newsroom hero: a compact trending-headlines rail beside the lead story. */
export function NewsHero({ lead, trending }: Props) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <LatestRail articles={trending.slice(0, 4)} title="Trending Now" />
      <div className="lg:col-span-2">
        <StoryCard article={lead} variant="lead" priority />
      </div>
    </section>
  );
}
