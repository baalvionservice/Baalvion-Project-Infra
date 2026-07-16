import Link from "next/link";
import {
  TrendingUp,
  Landmark,
  PieChart,
  PiggyBank,
  Scale,
  Wheat,
  Bitcoin,
  Home,
  Umbrella,
  Briefcase,
  Building2,
  Flame,
  Calculator,
  ArrowRight,
} from "lucide-react";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor } from "@/lib/topic-config";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import { InvestingTopicExplorer, type InvestingTopic } from "@/components/pages/InvestingTopicExplorer";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQItem from "@/components/faq/FAQItem";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";

const SLUG = "investing";

/** Investing sub-topics, in the same order as the site nav (Navbar.tsx "Investing" menu). */
const INVESTING_TOPICS: Array<InvestingTopic & { icon: React.ComponentType<{ className?: string }> }> = [
  { slug: "stocks", label: "Stocks", icon: TrendingUp },
  { slug: "bonds", label: "Bonds", icon: Landmark },
  { slug: "etfs", label: "ETFs", icon: PieChart },
  { slug: "mutual-funds", label: "Mutual Funds", icon: PiggyBank },
  { slug: "options", label: "Options", icon: Scale },
  { slug: "commodities", label: "Commodities", icon: Wheat },
  { slug: "cryptocurrency", label: "Cryptocurrency", icon: Bitcoin },
  { slug: "real-estate", label: "Real Estate", icon: Home },
  { slug: "retirement", label: "Retirement", icon: Umbrella },
  { slug: "portfolio", label: "Portfolio", icon: Briefcase },
  { slug: "brokers", label: "Brokers", icon: Building2 },
];

/** Real, functional calculator tools (product features, not editorial content). */
const INVESTING_TOOLS = [
  { href: "/financial-tools/investment", label: "Investment Calculator" },
  { href: "/financial-tools/compound-interest", label: "Compound Interest Calculator" },
  { href: "/financial-tools", label: "All Financial Tools" },
];

const EXPLORE_MORE = [
  { href: "/market-news", label: "Markets" },
  { href: "/economy", label: "Economy" },
  { href: "/banking", label: "Banking" },
  { href: "/personal-finance", label: "Personal Finance" },
  { href: "/reviews", label: "Reviews" },
];

/** CMS-first fetch for a single topic slug, same fallback chain as CategoryFeed. */
async function fetchTopicArticles(slug: string, limit: number): Promise<NewsArticle[]> {
  let items = await getCategoryArticles(slug, limit);
  if (items.length) return items;

  items = staticCategoryNews(slug).slice(0, limit);
  if (items.length) return items;

  const cat = staticCategoryFor(slug);
  return (cat ? newsArticles.filter((a) => a.category === cat) : []).slice(0, limit);
}

/**
 * Dedicated Investing hub — CMS-driven topic browser, trending list, and a
 * "Start Investing" path, all sourced live from cms-service (admin panel)
 * rather than any hardcoded article list. Falls back to the baked snapshot,
 * then bundled demo content, exactly like the shared CategoryFeed template.
 */
export async function InvestingHub() {
  const copy = topicCopy(SLUG);

  // 1) Main investing feed — same CMS-first fallback chain as every other topic page.
  let articles: NewsArticle[] = await getCategoryArticles(SLUG, 30);
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

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);
  const sidebarArticles = rest.slice(0, 3);
  const gridArticles = rest.slice(3);

  // 2) Per-topic live sets — fetched from the CMS in parallel. Powers both the
  //    topic explorer tabs and the "Start Investing" path below.
  const topicEntries = await Promise.all(
    INVESTING_TOPICS.map(async (t) => [t.slug, await fetchTopicArticles(t.slug, 6)] as const)
  );
  const articlesByTopic: Record<string, NewsArticle[]> = Object.fromEntries(topicEntries);

  // 3) "Popular this week" — ranked from the live feed by tracked view count,
  //    falling back to publish recency. No curated picks.
  const trending = [...articles]
    .sort((a, b) => {
      if (a.views != null && b.views != null) return b.views - a.views;
      if (a.views != null) return -1;
      if (b.views != null) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 4);

  // 4) "Start Investing" — the lead live article from each topic that has
  //    published content yet, in nav order. Updates automatically as the CMS
  //    publishes new coverage; nothing here is a fixed slug.
  const startInvestingSteps = INVESTING_TOPICS.map((t) => ({
    topic: t,
    article: articlesByTopic[t.slug]?.[0],
  })).filter((s): s is { topic: (typeof INVESTING_TOPICS)[number]; article: NewsArticle } => !!s.article)
    .slice(0, 6);

  // 5) FAQ — aggregated from the CMS's own per-article FAQ data
  //    (customFields.faq), not a hardcoded question list.
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const { items } = await listCmsContent({ categorySlug: SLUG, contentType: "article", limit: 12 });
    faqSource = items.map(cmsContentToArticle);
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    faqSource = staticArticleList().filter((a) => a.category === "Investing");
  }
  const seenQuestions = new Set<string>();
  const faqs = faqSource
    .flatMap((a) => a.faq ?? [])
    .filter((f) => {
      const key = f.question.trim().toLowerCase();
      if (seenQuestions.has(key)) return false;
      seenQuestions.add(key);
      return true;
    })
    .slice(0, 6);

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
        url: `${base}${newsArticleHref(a)}`,
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
      <HeadingSection tag={copy.tag} title={copy.title} description={copy.description} />
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground -mt-2 pb-6">
        {articles.length}+ Investing Articles &middot; Updated Daily
      </p>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
        {/* Browse Investing Topics */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Browse Investing Topics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {INVESTING_TOPICS.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="group flex flex-col items-center gap-2 rounded-lg border border-gray-100 px-3 py-5 text-center transition-colors hover:border-gray-900 hover:bg-gray-50"
              >
                <t.icon className="h-6 w-6 text-gray-500 transition-colors group-hover:text-gray-900" />
                <span className="text-xs font-semibold text-foreground">{t.label}</span>
              </Link>
            ))}
          </div>
        </section>

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

        {/* Popular this week */}
        {trending.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Popular This Week
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trending.map((article) => (
                <Link key={article.id} href={newsArticleHref(article)} className="group block">
                  <p className="text-xs font-semibold text-primary mb-1">{article.category}</p>
                  <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-3">
                    {article.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-400">{article.readTimeMinutes} min read</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Start Investing learning path */}
        {startInvestingSteps.length > 0 && (
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Start Investing
            </h3>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {startInvestingSteps.map((step, i) => (
                <li key={step.topic.slug}>
                  <Link href={newsArticleHref(step.article)} className="group flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">{step.topic.label}</p>
                      <p className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-2">
                        {step.article.title}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Topic explorer — replaces the generic news-type filter with real,
            CMS-fetched investing topics that match the site nav. */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Explore {isLive ? copy.title : "News"}
          </h3>
          <InvestingTopicExplorer
            topics={INVESTING_TOPICS.map(({ slug, label }) => ({ slug, label }))}
            articlesByTopic={articlesByTopic}
            allArticles={gridArticles}
          />
        </section>

        {/* Related tools */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <Calculator className="h-4 w-4" />
            Investing Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            {INVESTING_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-gray-900"
              >
                {tool.label}
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

        {/* FAQ — aggregated from CMS article FAQ data */}
        {faqs.length > 0 && (
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Frequently Asked Questions
            </h3>
            <div className="rounded-2xl border border-gray-100 px-4">
              {faqs.map((f) => (
                <FAQItem key={f.question} question={f.question} answer={f.answer} />
              ))}
            </div>
          </section>
        )}

        {/* Newsletter signup */}
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 py-12 text-center">
          <h3 className="text-lg font-bold text-foreground">Stay Ahead of the Markets</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Get investing analysis and market moves in your inbox.
          </p>
          <NewsletterForm />
        </section>

        {/* Explore More — internal cross-links to the other mega-menu categories */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Explore More
          </h3>
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

export default InvestingHub;
