import { newsArticles, NewsCategory } from "@/lib/data.news";
import { getPublishedNews, listCmsContent, cmsContentToNews } from "@/services/data/cms-public";
import { buildMetadata } from "@/lib/seo";
import { env } from "@/config/env";
import { Metadata } from "next";

import { BreakingTicker } from "@/components/news/BreakingTicker";
import { NewsHero } from "@/components/news/NewsHero";
import { TrendingRail } from "@/components/news/TrendingRail";
import { CategorySection } from "@/components/news/CategorySection";
import { TodayHighlights } from "@/components/news/TodayHighlights";
import { VideoCarousel } from "@/components/news/VideoCarousel";
import { LatestFeed } from "@/components/news/LatestFeed";
import { NewsSidebar } from "@/components/news/NewsSidebar";
import { NewsletterBand } from "@/components/landing/investopedia/NewsletterBand";
import { newsArticleHref } from "@/lib/data/article-url";
import { AdSenseUnit } from "@/components/common/AdSense";

// Empty hubs read to Google as exactly the thin/low-value content pattern
// that blocks AdSense approval (see GLOSSARY_LIVE in config/glossary.ts for
// the same call made for the glossary). noindex while no `news` content has
// been published — flips back automatically the moment one is, no redeploy
// needed.
export async function generateMetadata(): Promise<Metadata> {
  const liveNews = await getPublishedNews(1);
  return buildMetadata({
    canonical: '/news',
    title: "Financial News and Analysis",
    description:
      "Stay informed with the latest financial news, market insights, and expert analysis. Our news section covers global markets, economic trends, and investment strategies to help you make informed decisions.",
    noIndex: liveNews.length === 0,
  });
}

const FEED_PAGE_SIZE = 12;
const NICHE_CATEGORIES: NewsCategory[] = [
  "Markets",
  "Economy",
  "Stocks",
  "Crypto",
  "PersonalFinance",
  "RealEstate",
  "ETFs",
  "Bonds",
];

export default async function NewsPage() {
  // Live editorial news published from admin-platform via the CMS; fall back to the
  // static set while no `news` content is published yet (incremental rollout).
  const liveNews = await getPublishedNews(60);
  const newsList = liveNews.length > 0 ? liveNews : newsArticles;

  const featured = newsList.find((a) => a.featured) ?? newsList[0];

  if (!featured) {
    return (
      <div className="min-h-screen pt-20 text-center px-4">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-wide">News</h1>
        <p className="mt-3 text-muted-foreground">No news has been published yet.</p>
      </div>
    );
  }

  const rest = newsList.filter((a) => a.slug !== featured.slug);

  // Prefer editorially-flagged trending items, then real traffic (view count), and
  // only fall back to "most recent" when neither signal has data yet.
  let trending = rest.filter((a) => a.isTrending).slice(0, 12);
  if (trending.length < 12) {
    try {
      const { items } = await listCmsContent({ contentType: "news", sort: "views", limit: 12 });
      if (items.length) trending = items.map(cmsContentToNews).filter((a) => a.slug !== featured.slug);
    } catch {
      // keep the editorially-flagged (possibly empty) list; render falls through below
    }
  }
  if (!trending.length) trending = rest.slice(0, 12);

  // Initial page of the paginated "Latest News" feed (SSR first page; the client
  // component fetches subsequent pages from /api/news/latest).
  let initialFeed = rest;
  let initialHasMore = false;
  try {
    const { items, total } = await listCmsContent({ contentType: "news", page: 1, limit: FEED_PAGE_SIZE });
    if (items.length) {
      initialFeed = items.map(cmsContentToNews);
      initialHasMore = FEED_PAGE_SIZE < total;
    }
  } catch {
    // keep the static fallback slice
  }

  const base = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: newsList.slice(0, 25).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: a.title,
      url: `${base}${newsArticleHref(a)}`,
    })),
  };

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <BreakingTicker articles={newsList} />

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">
        {/* Hero + trending */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <NewsHero article={featured} />
          </div>
          <TrendingRail articles={trending} />
        </section>

        <AdSenseUnit slot="8362925887" format="auto" responsive={true} />

        {/* Niche category rails */}
        {NICHE_CATEGORIES.map((category) => (
          <CategorySection
            key={category}
            category={category}
            articles={newsList.filter((a) => a.category === category)}
          />
        ))}

        <TodayHighlights articles={rest} />

        <VideoCarousel articles={newsList} />

        {/* Latest news + sidebar */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Latest News
            </h2>
            <LatestFeed initialArticles={initialFeed} initialHasMore={initialHasMore} />
          </div>
          <NewsSidebar articles={newsList} />
        </section>

        <NewsletterBand />
      </div>
    </div>
  );
}
