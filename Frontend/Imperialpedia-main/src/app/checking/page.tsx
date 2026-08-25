import { CategoryFeed, categoryHasLiveContent } from "@/components/pages/CategoryFeed";
import { ArticleSidebar } from "@/components/article/ArticleSidebar";
import { ValuePropsCard } from "@/components/pages/ValuePropsCard";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";
import { Metadata } from "next";

const SLUG = "checking";
const LABEL = "Checking Accounts";

// Empty category hubs read to Google as exactly the thin/low-value content
// pattern that blocks AdSense approval (see GLOSSARY_LIVE in config/glossary.ts
// for the same call made for the glossary). noindex until this category has a
// real published article — flips back automatically once one exists, no
// redeploy needed.
export async function generateMetadata(): Promise<Metadata> {
  const hasContent = await categoryHasLiveContent(SLUG);
  return buildMetadata({ ...topicMeta(SLUG), noIndex: !hasContent });
}

// Topic hub — content is CMS articles only (verified: no import of
// marketsLoader/worldFeed/live-quote data anywhere in this page's component
// tree), so there's no live-ticker freshness need. ISR instead of
// force-dynamic: /api/revalidate already revalidates this route instantly on
// every CMS publish/update/delete, so force-dynamic was paying for a full CMS
// fetch + re-render on every single request (including every bot/crawler hit)
// for no freshness benefit beyond what the webhook already provides.
export const revalidate = 3600;

export default function Page() {
  return (
    <CategoryFeed
      slug={SLUG}
      sidebar={<ArticleSidebar categorySlug={SLUG} categoryLabel={LABEL} excludeSlug="" />}
      rightRail={<ValuePropsCard categoryLabel={LABEL} />}
      trustBar
      newsletter
    />
  );
}
