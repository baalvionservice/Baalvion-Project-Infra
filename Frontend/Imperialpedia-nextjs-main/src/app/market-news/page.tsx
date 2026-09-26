import { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketNewsHub } from "@/components/pages/MarketNewsHub";
import { categoryHasLiveContent } from "@/components/pages/CategoryFeed";
import { topicMeta } from "@/lib/topic-config";
import { buildMetadata } from "@/lib/seo";
import { MARKETS_SECTION_LIVE } from "@/config/sections";

const SLUG = "market-news";
// The CMS's real category slug is "markets" (see the identical note in
// MarketNewsHub.tsx) — checking noindex against "market-news" would always
// read as empty regardless of actual content.
const CMS_CATEGORY_SLUG = "markets";

// Empty hub pages read to Google as exactly the thin/low-value content
// pattern that blocks AdSense approval (same pattern as every CategoryFeed
// topic page's generateMetadata). This page was missing that gate entirely,
// so it stayed indexable while the "markets" category had zero published
// articles — the widgets (live indices, movers, calendars) are real, but an
// article-less "Market News" hub linked from primary nav is still exactly
// what a reviewer or crawler reads as thin content. Flips back to indexed
// automatically once an article is published under "markets" in the CMS.
export async function generateMetadata(): Promise<Metadata> {
  if (!MARKETS_SECTION_LIVE) return buildMetadata({ ...topicMeta(SLUG), noIndex: true });
  const hasContent = await categoryHasLiveContent(CMS_CATEGORY_SLUG);
  return buildMetadata({ ...topicMeta(SLUG), noIndex: !hasContent });
}

// Editorial content changes on publish — render LIVE per-request so the CMS
// is read on every request (works on Vercel against a public CMS).
export const dynamic = 'force-dynamic';

export default function Page() {
  // Belt-and-suspenders: next.config.ts already 301s /market-news to /,
  // but guard here too so any request that bypasses the redirect layer
  // returns 404 rather than rendering a hidden page.
  if (!MARKETS_SECTION_LIVE) notFound();
  return <MarketNewsHub />;
}

