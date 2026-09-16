import { ReviewsHub } from "@/components/pages/ReviewsHub";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";
import { REVIEWS_SECTION_LIVE } from "@/config/sections";

const SLUG = "reviews";

// The hub renders a category grid, a six-question FAQ and a "0 + Reviews &
// Comparisons" counter directly above the words "No reviews published yet" —
// an under-construction page, which is a documented AdSense disapproval
// reason. noindex until the first reviews are actually published; flip
// REVIEWS_SECTION_LIVE in that same change (see config/sections.ts).
export const metadata = buildMetadata({
  ...topicMeta(SLUG),
  noIndex: !REVIEWS_SECTION_LIVE,
});

// Topic hub — content is CMS articles only (verified: no import of
// marketsLoader/worldFeed/live-quote data anywhere in this page's component
// tree), so there's no live-ticker freshness need. ISR instead of
// force-dynamic: /api/revalidate already revalidates this route instantly on
// every CMS publish/update/delete, so force-dynamic was paying for a full CMS
// fetch + re-render on every single request (including every bot/crawler hit)
// for no freshness benefit beyond what the webhook already provides.
export const revalidate = 3600;

export default function ReviewsPage() {
  return <ReviewsHub />;
}
