import Link from "next/link";
import {
  TrendingUp,
  Building2,
  BarChart3,
  Globe,
  Banknote,
  Percent,
  Wheat,
  Bitcoin,
  Landmark,
  Flame,
  Sparkles,
  Award,
  BookOpen,
  CalendarClock,
  ArrowRight,
} from "lucide-react";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor } from "@/lib/topic-config";
import { marketIndicators } from "@/lib/data/worldData";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import { MarketSnapshot } from "@/components/pages/MarketSnapshot";
import { TrustBar } from "@/components/pages/TrustBar";
import { EarningsCalendarTable } from "@/components/pages/market-news/EarningsCalendarTable";
import { EconomicCalendarTable, type EconomicCalendarRow } from "@/components/pages/EconomicCalendarTable";
import { ArticleCard } from "@/app/news/NewsArticleCard";
import { BreakingTicker } from "@/components/news/BreakingTicker";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQItem from "@/components/faq/FAQItem";
import { env } from "@/config/env";

const SLUG = "market-news";

/** Real, nav-matching market topics (see the "Markets" mega-menu in Navbar.tsx),
 * in wire-service order — replaces the generic All/Market/Company/Crypto/PF filter. */
const MARKET_TOPICS: Array<{ slug: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { slug: "stocks", label: "Stocks", icon: TrendingUp },
  { slug: "earnings", label: "Earnings", icon: BarChart3 },
  { slug: "company-news", label: "Companies", icon: Building2 },
  { slug: "economy", label: "Economy", icon: Globe },
  { slug: "fed", label: "Federal Reserve", icon: Banknote },
  { slug: "inflation", label: "Inflation", icon: Percent },
  { slug: "commodities", label: "Commodities", icon: Wheat },
  { slug: "crypto", label: "Crypto", icon: Bitcoin },
  { slug: "bonds", label: "Bonds", icon: Landmark },
];

/** Explainer pages that exist today — the "Market Guides" rail, kept separate from daily news. */
const MARKET_GUIDES = [
  { href: "/fed", label: "The Federal Reserve, Explained" },
  { href: "/inflation", label: "How Inflation Moves Markets" },
  { href: "/gdp", label: "What Is GDP?" },
  { href: "/bonds", label: "Understanding Bond Yields" },
  { href: "/earnings", label: "How Earnings Affect Stocks" },
];

const EXPLORE_MORE = [
  { href: "/investing", label: "Investing" },
  { href: "/economy", label: "Economy" },
  { href: "/banking", label: "Banking" },
  { href: "/personal-finance", label: "Personal Finance" },
  { href: "/reviews", label: "Reviews" },
];

/** Evergreen conceptual FAQs — general finance education, not time-bound facts —
 * used only to top up the CMS-aggregated list below a useful minimum. */
const FALLBACK_FAQS: { question: string; answer: string }[] = [
  {
    question: "Why do stock markets move every day?",
    answer:
      "Prices shift constantly because buyers and sellers keep reassessing what a company (or the economy) is worth as new information arrives — earnings, economic data, interest-rate expectations, and simple shifts in investor sentiment all move the price at which the next trade happens.",
  },
  {
    question: "What causes market volatility?",
    answer:
      "Volatility rises when there's more uncertainty or disagreement about the future — around Fed decisions, inflation surprises, geopolitical events, or earnings — so prices swing more as investors reprice risk quickly in both directions.",
  },
  {
    question: "How does the Fed affect stocks?",
    answer:
      "The Federal Reserve sets short-term interest rates, which ripple through borrowing costs, corporate profits, and the relative appeal of stocks versus bonds and cash. Lower rates tend to support stock valuations; higher rates tend to weigh on them.",
  },
  {
    question: "Why does inflation impact investments?",
    answer:
      "Inflation erodes the purchasing power of future cash flows and often pushes central banks to raise interest rates, both of which can lower what investors are willing to pay today for stocks and bonds.",
  },
  {
    question: "Why does gold rise during uncertainty?",
    answer:
      "Gold isn't tied to any single government or company's finances, so investors often turn to it as a store of value when confidence in currencies, markets, or the economic outlook weakens — increasing demand and, typically, its price.",
  },
  {
    question: "What is a market correction?",
    answer:
      "A correction is a decline of roughly 10% or more from a recent high in a stock, index, or market. Corrections are common and often temporary, distinguishing them from the steeper, longer declines that define a bear market.",
  },
];

/** Claims articles into a section while skipping any slug already used by an
 * earlier section — the mechanism that keeps the same story from appearing
 * twice across the hub (Featured, rails, trending lists, etc. all share one pool). */
function makeClaimer() {
  const used = new Set<string>();
  return function claimUnique(list: NewsArticle[], n: number): NewsArticle[] {
    const out: NewsArticle[] = [];
    for (const a of list) {
      if (used.has(a.slug)) continue;
      out.push(a);
      used.add(a.slug);
      if (out.length >= n) break;
    }
    return out;
  };
}

/** CMS-first fetch for a single topic slug, same fallback chain used site-wide. */
async function fetchTopicArticles(slug: string, limit: number): Promise<NewsArticle[]> {
  let items = await getCategoryArticles(slug, limit);
  if (items.length) return items;

  items = staticCategoryNews(slug).slice(0, limit);
  if (items.length) return items;

  const cat = staticCategoryFor(slug);
  return (cat ? newsArticles.filter((a) => a.category === cat) : []).slice(0, limit);
}

/**
 * Dedicated Market News hub — Bloomberg/Reuters-style layout: breaking ticker,
 * a market snapshot, a featured story, a real per-topic section rail (Stocks,
 * Earnings, Companies, Economy, Fed, Inflation, Commodities, Crypto, Bonds),
 * three distinct trending lists, calendar-styled cross-links, and guides — all
 * sourced live from cms-service, falling back to the baked snapshot then
 * bundled demo content exactly like every other topic page. A single shared
 * "claimer" dedupes articles across every section so nothing repeats.
 */
export async function MarketNewsHub() {
  const copy = topicCopy(SLUG);

  // 1) Main feed — same CMS-first fallback chain as every other topic page.
  let articles: NewsArticle[] = await getCategoryArticles(SLUG, 40);
  let isLive = articles.length > 0;
  if (!isLive) {
    const baked = staticCategoryNews(SLUG);
    if (baked.length) {
      articles = baked;
      isLive = true;
    }
  }
  if (!isLive) {
    const cat = staticCategoryFor(SLUG);
    const filtered = cat ? newsArticles.filter((a) => a.category === cat) : [];
    articles = filtered.length ? filtered : newsArticles;
  }

  const claim = makeClaimer();

  const featured = articles.find((a) => a.featured) ?? articles[0];
  if (featured) claim([featured], 1); // reserve it so it can't resurface elsewhere
  const rest = articles.filter((a) => a !== featured);

  const sidebarArticles = claim(rest, 3);
  const latestGrid = claim(rest, 6);

  // 2) Per-topic live sets, fetched in parallel — powers the section rails,
  //    with extra headroom (limit 10) so the calendar tables below can draw
  //    on real leftover coverage instead of an empty pool.
  const topicEntries = await Promise.all(
    MARKET_TOPICS.map(async (t) => [t.slug, await fetchTopicArticles(t.slug, 10)] as const)
  );
  const articlesByTopic: Record<string, NewsArticle[]> = Object.fromEntries(topicEntries);

  // 3) Three distinct trending signals — real, different sort criteria, not
  //    three labels over the same list.
  const mostRead = claim(
    [...articles].sort((a, b) => {
      if (a.views != null && b.views != null) return b.views - a.views;
      if (a.views != null) return -1;
      if (b.views != null) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }),
    5
  );
  const trendingNow = claim(
    [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    5
  );
  const editorsPicks = claim(
    articles.filter((a) => a.featured),
    4
  );

  // 4) Real per-topic section rails.
  const topicRails: Record<string, NewsArticle[]> = {};
  for (const t of MARKET_TOPICS) {
    topicRails[t.slug] = claim(articlesByTopic[t.slug] ?? [], 6);
  }
  const visibleTopics = MARKET_TOPICS.filter((t) => (topicRails[t.slug]?.length ?? 0) > 0);

  // 5) "Market Analysis" — longer-form pieces, derived from real read time,
  //    kept in its own section and never mixed into the breaking-news feed above.
  const analysis = claim(
    [...articles]
      .filter((a) => a.readTimeMinutes >= 6)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    4
  );

  // 6) Calendars — real leftover coverage from the earnings/economy/fed/inflation
  //    pools already fetched above, not fabricated company/date/estimate rows.
  const earningsCalendarRows = claim(articlesByTopic.earnings ?? [], 5);
  const economicCandidates: EconomicCalendarRow[] = [
    ...(articlesByTopic.economy ?? []).map((article) => ({ article, eventType: "Economic Data" })),
    ...(articlesByTopic.fed ?? []).map((article) => ({ article, eventType: "Federal Reserve" })),
    ...(articlesByTopic.inflation ?? []).map((article) => ({ article, eventType: "Inflation" })),
  ].sort((a, b) => new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime());
  const economicCalendarRows: EconomicCalendarRow[] = [];
  for (const row of economicCandidates) {
    const [kept] = claim([row.article], 1);
    if (kept) economicCalendarRows.push(row);
    if (economicCalendarRows.length >= 6) break;
  }

  // 7) FAQ — aggregated from the CMS's own per-article FAQ data, topped up with
  //    evergreen conceptual questions (not time-bound facts) when coverage is thin.
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const { items } = await listCmsContent({ categorySlug: SLUG, contentType: "article", limit: 12 });
    faqSource = items.map(cmsContentToArticle);
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    faqSource = staticArticleList().filter((a) => a.category === "Investing" || a.category === "Markets");
  }
  const seenQuestions = new Set<string>();
  const faqs = faqSource
    .flatMap((a) => a.faq ?? [])
    .filter((f) => {
      const key = f.question.trim().toLowerCase();
      if (seenQuestions.has(key)) return false;
      seenQuestions.add(key);
      return true;
    });
  for (const f of FALLBACK_FAQS) {
    const key = f.question.trim().toLowerCase();
    if (!seenQuestions.has(key)) {
      seenQuestions.add(key);
      faqs.push(f);
    }
  }

  // ── SEO: CollectionPage + ItemList + Breadcrumb structured data ──
  const base = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const pageUrl = `${base}/${SLUG}`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: copy.title,
    description: copy.description,
    url: pageUrl,
    isPartOf: { "@type": "WebSite", name: "Imperialpedia", url: base },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.slice(0, 25).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.title,
        url: `${base}/${a.slug}`,
      })),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: copy.title, item: pageUrl },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <BreakingTicker articles={articles} />

      <HeadingSection tag={copy.tag} title={copy.title} description={copy.description} />
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground -mt-2 pb-4">
        {articles.length}+ Market Stories &middot; Updated Throughout the Day
      </p>
      <TrustBar />

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
        <MarketSnapshot indicators={marketIndicators} />

        {featured && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <aside className="flex flex-col">
              {sidebarArticles.map((article) => (
                <HorizontalArticleCard key={article.id} article={article} />
              ))}
            </aside>
            <div className="lg:col-span-2">
              <FeaturedArticleCard article={featured} />
            </div>
          </section>
        )}

        {latestGrid.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Latest Market News
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestGrid.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {(mostRead.length > 0 || trendingNow.length > 0 || editorsPicks.length > 0) && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {mostRead.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-5 pb-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Most Read
                </h2>
                <ol className="space-y-4">
                  {mostRead.map((article, i) => (
                    <li key={article.id}>
                      <Link href={`/${article.slug}`} className="group flex gap-3">
                        <span className="text-xl font-black text-gray-200">{i + 1}</span>
                        <div>
                          <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="mt-1 text-xs text-gray-400">{article.readTimeMinutes} min read</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {trendingNow.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-5 pb-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Trending Now
                </h2>
                <ol className="space-y-4">
                  {trendingNow.map((article) => (
                    <li key={article.id}>
                      <Link href={`/${article.slug}`} className="group block">
                        <p className="text-xs font-semibold text-primary mb-1">{article.category}</p>
                        <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-2">
                          {article.title}
                        </h3>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {editorsPicks.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-5 pb-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Editor&apos;s Picks
                </h2>
                <ol className="space-y-4">
                  {editorsPicks.map((article) => (
                    <li key={article.id}>
                      <Link href={`/${article.slug}`} className="group block">
                        <p className="text-xs font-semibold text-primary mb-1">{article.category}</p>
                        <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-2">
                          {article.title}
                        </h3>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* Real per-topic section rails — replaces the generic type filter. */}
        {visibleTopics.map((topic) => (
          <section key={topic.slug}>
            <div className="flex items-center justify-between mb-6 pb-2">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400">
                <topic.icon className="h-4 w-4" />
                {topic.label}
              </h2>
              <Link
                href={`/${topic.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary"
              >
                See all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {topicRails[topic.slug].map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ))}

        {analysis.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Market Analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {analysis.map((article) => (
                <Link key={article.id} href={`/${article.slug}`} className="group flex gap-4">
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">{article.category}</p>
                    <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">{article.readTimeMinutes} min read</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Calendars — real published coverage in a calendar-table layout, never fabricated future dates. */}
        {(earningsCalendarRows.length > 0 || economicCalendarRows.length > 0) && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              <CalendarClock className="h-4 w-4" />
              Calendars
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EarningsCalendarTable articles={earningsCalendarRows} />
              <EconomicCalendarTable rows={economicCalendarRows} />
            </div>
          </section>
        )}

        {/* Market Guides — evergreen education, kept separate from daily news. */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <BookOpen className="h-4 w-4" />
            Market Guides
          </h2>
          <div className="flex flex-wrap gap-3">
            {MARKET_GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-gray-900"
              >
                {guide.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </section>

        {!featured && (
          <p className="py-16 text-center text-muted-foreground">
            No articles published in this category yet — check back soon.
          </p>
        )}

        {/* FAQ */}
        {faqs.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Frequently Asked Questions
            </h2>
            <div className="rounded-2xl border border-gray-100 px-4">
              {faqs.map((f) => (
                <FAQItem key={f.question} question={f.question} answer={f.answer} />
              ))}
            </div>
          </section>
        )}

        {/* Newsletter signup */}
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 py-12 text-center">
          <h2 className="text-lg font-bold text-foreground">Never Miss the Market</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            A 5-minute market briefing delivered every morning.
          </p>
          <NewsletterForm />
        </section>

        {/* Explore More — internal cross-links to the other mega-menu categories */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Explore More
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {EXPLORE_MORE.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default MarketNewsHub;
