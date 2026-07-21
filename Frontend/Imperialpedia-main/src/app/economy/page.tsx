import { EconomyHub } from "@/components/pages/EconomyHub";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";

const SLUG = "economy";

export const metadata = buildMetadata(topicMeta(SLUG));

// Topic hub — content is CMS articles only (verified: no import of
// marketsLoader/worldFeed/live-quote data anywhere in this page's component
// tree), so there's no live-ticker freshness need. ISR instead of
// force-dynamic: /api/revalidate already revalidates this route instantly on
// every CMS publish/update/delete, so force-dynamic was paying for a full CMS
// fetch + re-render on every single request (including every bot/crawler hit)
// for no freshness benefit beyond what the webhook already provides.
export const revalidate = 3600;

export default function Page() {
  return <EconomyHub />;
}
