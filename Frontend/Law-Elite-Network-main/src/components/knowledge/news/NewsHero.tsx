import type { CmsArticle } from "@/lib/cms";
import { StoryCard } from "./StoryCard";
import { LatestRail } from "./LatestRail";

type Props = {
  lead: CmsArticle;
  trending: CmsArticle[];
};

/** CNN-style hero: lead story plus a trending-headlines rail beside it. */
export function NewsHero({ lead, trending }: Props) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <StoryCard article={lead} variant="lead" priority />
      </div>
      <LatestRail articles={trending} title="Trending Now" />
    </section>
  );
}
