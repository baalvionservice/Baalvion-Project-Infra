import { LatestNewsPage } from "./components/LatestNewsPage";
import { buildMetadata } from "@/lib/seo";
import { getPublishedNews } from "@/services/data/cms-public";
import { Metadata } from "next";
import { NEWS_HUB_MIN_ARTICLES, newsHubIsLive } from "@/config/sections";

export default function LatestPage() {
  return <LatestNewsPage />;
}

// A bare object here (no `alternates.canonical`) previously inherited the
// root layout's default canonical (the homepage), making every visit to
// /latest report as a duplicate of "/" in Search Console. buildMetadata
// self-canonicalizes it instead.
//
// Empty hubs read to Google as exactly the thin/low-value content pattern
// that blocks AdSense approval (see GLOSSARY_LIVE in config/glossary.ts for
// the same call made for the glossary). noindex until the newsroom has enough
// published items to be a section rather than a template — the old `=== 0`
// threshold meant a single article was enough to submit this page, and at two
// articles "Latest News" rendered 194 words, most of them navigation.
export async function generateMetadata(): Promise<Metadata> {
  const liveNews = await getPublishedNews(NEWS_HUB_MIN_ARTICLES);
  return buildMetadata({
    canonical: "/latest",
    title: "Latest News - Stay Updated",
    description:
      "Get the latest financial and business news with real-time updates",
    noIndex: !newsHubIsLive(liveNews.length),
  });
}
