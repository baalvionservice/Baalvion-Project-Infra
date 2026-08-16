import Link from "next/link";
import {
  BookOpen,
  Landmark,
  Rocket,
  Shapes,
  Ruler,
  Compass,
  LineChart,
  Calculator,
  ArrowRight,
  Flame,
  Building2,
  BarChart3,
  ListChecks,
} from "lucide-react";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listAllCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
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

const SLUG = "stocks";

/** Educational sections that make up the Stocks pillar, in reading order. */
const STOCK_SECTIONS: Array<InvestingTopic & { icon: React.ComponentType<{ className?: string }> }> = [
  { slug: "stock-basics", label: "Stock Basics", icon: BookOpen },
  { slug: "how-the-stock-market-works", label: "How the Market Works", icon: Landmark },
  { slug: "beginner-investing", label: "Beginner Investing", icon: Rocket },
  { slug: "types-of-stocks", label: "Types of Stocks", icon: Shapes },
  { slug: "market-metrics", label: "Market Metrics", icon: Ruler },
  { slug: "investing-strategies", label: "Investing Strategies", icon: Compass },
  { slug: "stock-analysis", label: "Stock Analysis", icon: LineChart },
];

/** Canonical beginner progression — "Learn Stock Investing" — resolved against live articles. */
const LEARNING_PATH_SLUGS = [
  "what-is-a-stock",
  "what-is-the-stock-market",
  "first-stock-purchase-guide",
  "risk-management-for-stock-investors",
  "portfolio-allocation-basics",
  "long-term-investing-explained",
  "fundamental-analysis-explained",
];

const FLAGSHIP_COMPANIES = [
  { slug: "apple", name: "Apple" },
  { slug: "microsoft", name: "Microsoft" },
  { slug: "nvidia", name: "NVIDIA" },
  { slug: "amazon", name: "Amazon" },
  { slug: "tesla", name: "Tesla" },
  { slug: "alphabet", name: "Alphabet" },
  { slug: "meta", name: "Meta" },
  { slug: "berkshire-hathaway", name: "Berkshire Hathaway" },
];

const MARKET_INDEXES = [
  { slug: "sp-500", name: "S&P 500" },
  { slug: "nasdaq-composite", name: "Nasdaq" },
  { slug: "dow-jones", name: "Dow Jones" },
  { slug: "russell-2000", name: "Russell 2000" },
  { slug: "ftse-100", name: "FTSE 100" },
  { slug: "nikkei-225", name: "Nikkei" },
  { slug: "sensex", name: "Sensex" },
  { slug: "nifty-50", name: "Nifty 50" },
];

const STOCK_LISTS = [
  { slug: "top-stocks", name: "Top Stocks" },
  { slug: "trending-stocks", name: "Trending Stocks" },
  { slug: "dividend-stocks", name: "Dividend Stocks" },
  { slug: "ai-stocks", name: "AI Stocks" },
  { slug: "technology-stocks", name: "Technology Stocks" },
  { slug: "banking-stocks", name: "Banking Stocks" },
  { slug: "energy-stocks", name: "Energy Stocks" },
  { slug: "healthcare-stocks", name: "Healthcare Stocks" },
  { slug: "ev-stocks", name: "EV Stocks" },
  { slug: "semiconductor-stocks", name: "Semiconductor Stocks" },
  { slug: "high-growth-stocks", name: "High Growth Stocks" },
];

const STOCK_TOOLS = [
  { href: "/financial-tools/compound-interest", label: "Compound Interest Calculator" },
  { href: "/financial-tools/investment", label: "Investment Calculator" },
  { href: "/financial-tools/cagr", label: "CAGR Calculator" },
  { href: "/financial-tools/dividend", label: "Dividend Calculator" },
  { href: "/financial-tools/position-size", label: "Position Size Calculator" },
  { href: "/financial-tools/profit-loss", label: "Profit/Loss Calculator" },
];

const RELATED_TOPICS = [
  { href: "/etfs", label: "ETFs" },
  { href: "/mutual-funds", label: "Mutual Funds" },
  { href: "/bonds", label: "Bonds" },
  { href: "/options", label: "Options" },
  { href: "/portfolio", label: "Portfolio Management" },
  { href: "/retirement", label: "Retirement Investing" },
];

/** CMS-first fetch for a single section slug, grouping by `customFields.section`. */
function groupBySection(articles: NewsArticle[]): Record<string, NewsArticle[]> {
  const bySlug: Record<string, NewsArticle[]> = {};
  for (const section of STOCK_SECTIONS) bySlug[section.slug] = [];
  for (const article of articles) {
    const label = (article.customFields?.section as string | undefined) ?? undefined;
    const match = STOCK_SECTIONS.find((s) => s.label === label);
    if (match) bySlug[match.slug].push(article);
  }
  return bySlug;
}

/**
 * Dedicated Stocks hub — expands on the shared CategoryFeed template with a
 * section-based explorer (Stock Basics, Market Metrics, ...), a beginner
 * learning path, a company/index/list directory, tools, and an aggregated
 * FAQ bank — all sourced from the CMS `stocks` category, never a hardcoded
 * article list. Falls back to the baked snapshot, then bundled demo content,
 * exactly like the shared CategoryFeed template.
 */
export async function StocksHub() {
  const copy = topicCopy(SLUG);

  let articles: NewsArticle[] = await getCategoryArticles(SLUG, 100);
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
    articles = cat ? newsArticles.filter((a) => a.category === cat) : [];
  }

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);
  const sidebarArticles = rest.slice(0, 3);

  const articlesBySection = groupBySection(articles);

  const trending = [...articles]
    .sort((a, b) => {
      if (a.views != null && b.views != null) return b.views - a.views;
      if (a.views != null) return -1;
      if (b.views != null) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 4);

  const bySlug = new Map(articles.map((a) => [a.slug, a] as const));
  const learningPath = LEARNING_PATH_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (a): a is NewsArticle => !!a
  );

  const beginnerGuide = articlesBySection["beginner-investing"]?.[0] ?? featured;

  const lastUpdated = articles.reduce<string | undefined>((latest, a) => {
    const stamp = a.updatedAt ?? a.publishedAt;
    if (!latest || new Date(stamp).getTime() > new Date(latest).getTime()) return stamp;
    return latest;
  }, undefined);

  // FAQ — aggregated from every live stocks article's own FAQ data, deduped.
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const items = await listAllCmsContent({ categorySlug: SLUG, contentType: "article" });
    faqSource = items.map((raw) => cmsContentToArticle(raw));
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    faqSource = staticArticleList().filter((a) => a.category === "Stocks");
  }
  const seenQuestions = new Set<string>();
  const allFaqs = faqSource
    .flatMap((a) => a.faq ?? [])
    .filter((f) => {
      const key = f.question.trim().toLowerCase();
      if (seenQuestions.has(key)) return false;
      seenQuestions.add(key);
      return true;
    });
  const faqPreview = allFaqs.slice(0, 8);

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
      { "@type": "ListItem", position: 2, name: "Investing", item: `${base}/investing` },
      { "@type": "ListItem", position: 3, name: copy.title, item: pageUrl },
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
      <HeadingSection
        tag={copy.tag}
        eyebrow={{ label: "INVESTING", href: "/investing" }}
        title={copy.title}
        description={copy.description}
      />
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground -mt-2 pb-6">
        {articles.length}+ Stock Market Guides
        {lastUpdated && (
          <> &middot; Updated {new Date(lastUpdated).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</>
        )}
      </p>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
        {/* Expanded hero intro: what stocks are, why people invest, how they work, benefits/risks */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-muted-foreground max-w-5xl mx-auto">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">What Are Stocks?</h2>
            <p>
              A stock is a share of ownership in a company. Buying one makes you a part-owner of that
              business, with a claim on its future profits and, in many cases, a vote on how it&apos;s run.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Why People Invest in Stocks</h3>
            <p>
              Stocks have historically offered some of the strongest long-run returns of any widely
              available asset class, making them a core building block for retirement savings, education
              funds, and long-term wealth building.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">How Stocks Work</h3>
            <p>
              Shares trade on exchanges like the NYSE and Nasdaq, where prices move constantly based on
              supply, demand, company performance, and the broader economy. You can buy or sell through a
              brokerage account, typically in seconds.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Benefits and Risks</h3>
            <p>
              Stocks can appreciate in price and pay dividends, but their value can also fall sharply and
              quickly. Diversification, time horizon, and risk tolerance all shape how much of a portfolio
              belongs in individual stocks versus funds.
            </p>
          </div>
        </section>

        {beginnerGuide && (
          <section className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Featured Beginner Guide</p>
            <Link href={newsArticleHref(beginnerGuide)} className="group">
              <h3 className="text-lg font-bold text-foreground group-hover:underline">{beginnerGuide.title}</h3>
            </Link>
          </section>
        )}

        {/* Browse Stocks Sections */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Explore Stocks
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {STOCK_SECTIONS.map((s) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="group flex flex-col items-center gap-2 rounded-lg border border-gray-100 px-3 py-5 text-center transition-colors hover:border-gray-900 hover:bg-gray-50"
              >
                <s.icon className="h-6 w-6 text-gray-500 transition-colors group-hover:text-gray-900" />
                <span className="text-xs font-semibold text-foreground">{s.label}</span>
              </a>
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
                </Link>
              ))}
            </div>
          </section>
        )}

        {learningPath.length > 0 && (
          <section id="learning-path">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Learn Stock Investing
            </h3>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {learningPath.map((article, i) => (
                <li key={article.slug}>
                  <Link href={newsArticleHref(article)} className="group flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-2">
                      {article.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section id="stock-basics">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Explore {isLive ? copy.title : "News"}
          </h3>
          <InvestingTopicExplorer
            topics={STOCK_SECTIONS.map(({ slug, label }) => ({ slug, label }))}
            articlesByTopic={articlesBySection}
            allArticles={rest}
          />
        </section>

        {/* Popular Companies */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <Building2 className="h-4 w-4" />
            Popular Companies
          </h3>
          <div className="flex flex-wrap gap-3">
            {FLAGSHIP_COMPANIES.map((c) => (
              <Link
                key={c.slug}
                href={`/companies/${c.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-gray-900"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Indexes */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <BarChart3 className="h-4 w-4" />
            Popular Indexes
          </h3>
          <div className="flex flex-wrap gap-3">
            {MARKET_INDEXES.map((idx) => (
              <Link
                key={idx.slug}
                href={`/stocks/indexes/${idx.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-gray-900"
              >
                {idx.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Stock Lists */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <ListChecks className="h-4 w-4" />
            Stock Lists
          </h3>
          <div className="flex flex-wrap gap-3">
            {STOCK_LISTS.map((list) => (
              <Link
                key={list.slug}
                href={`/stocks/lists/${list.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-gray-900"
              >
                {list.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Key Terms / Glossary section omitted — /terms is offline pending
            AdSense approval, see src/config/glossary.ts. */}

        {/* Related tools */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <Calculator className="h-4 w-4" />
            Stock Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            {STOCK_TOOLS.map((tool) => (
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

        {faqPreview.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                Frequently Asked Questions
              </h3>
              {allFaqs.length > faqPreview.length && (
                <Link href="/stocks/faq" className="text-xs font-semibold text-primary hover:underline">
                  View all {allFaqs.length} FAQs &rarr;
                </Link>
              )}
            </div>
            <div className="rounded-2xl border border-gray-100 px-4">
              {faqPreview.map((f) => (
                <FAQItem key={f.question} question={f.question} answer={f.answer} />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 py-12 text-center">
          <h3 className="text-lg font-bold text-foreground">Stay Ahead of the Markets</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Get stock analysis and market moves in your inbox.
          </p>
          <NewsletterForm />
        </section>

        {/* Related Topics */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Related Topics
          </h3>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {RELATED_TOPICS.map((link) => (
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

export default StocksHub;
