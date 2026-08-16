import { LatestNewsPage } from "./components/LatestNewsPage";
import { buildMetadata } from "@/lib/seo";
import { getPublishedNews } from "@/services/data/cms-public";
import { Metadata } from "next";

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
// the same call made for the glossary). noindex while no `news` content has
// been published (same source LatestNewsPage itself renders from) — flips
// back automatically the moment one is, no redeploy needed.
export async function generateMetadata(): Promise<Metadata> {
  const liveNews = await getPublishedNews(1);
  return buildMetadata({
    canonical: "/latest",
    title: "Latest News - Stay Updated",
    description:
      "Get the latest financial and business news with real-time updates",
    noIndex: liveNews.length === 0,
  });
}
