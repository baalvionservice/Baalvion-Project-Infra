import Link from "next/link";
import {
  BarChart3,
  Banknote,
  Percent,
  TrendingUp,
  Briefcase,
  Landmark,
  Scale,
  Coins,
  Globe,
  ArrowRight,
  BookOpen,
  CalendarClock,
} from "lucide-react";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor } from "@/lib/topic-config";
import { economicIndicators } from "@/lib/data/economicIndicators";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import { TrustBar } from "@/components/pages/TrustBar";
import { EconomicSnapshot } from "@/components/pages/EconomicSnapshot";
import { ProductSection } from "@/components/pages/ProductSection";
import { EconomicCalendarTable, type EconomicCalendarRow } from "@/components/pages/EconomicCalendarTable";
import { ArticleCard } from "@/app/news/NewsArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQItem from "@/components/faq/FAQItem";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";

const SLUG = "economy";
const TOPIC_FETCH_LIMIT = 12;

/** The 9 real subcategory slugs behind "Explore Topics" — Recessions & Business
 * Cycles and Economic Systems are skipped, since neither has a real page yet. */
const TOPICS: Array<{
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { slug: "indicators", label: "Economic Indicators", icon: BarChart3 },
  { slug: "fed", label: "Federal Reserve & Central Banks", icon: Banknote },
  { slug: "inflation", label: "Inflation", icon: Percent },
  { slug: "gdp", label: "GDP & Economic Growth", icon: TrendingUp },
  { slug: "unemployment", label: "Employment & Jobs", icon: Briefcase },
  { slug: "interest-rates", label: "Interest Rates", icon: Landmark },
  { slug: "fiscal-policy", label: "Fiscal Policy", icon: Scale },
  { slug: "monetary-policy", label: "Monetary Policy", icon: Coins },
  { slug: "global", label: "Global Economy", icon: Globe },
];

/** "Start Here" concept tiles — a topical entry point, not a stand-in for
 * articles that don't exist. Each links to a real, live topic page. */
const START_HERE_CONCEPTS = [
  { emoji: "📈", label: "Economic Growth", description: "How economies expand and create wealth", href: "/gdp" },
  { emoji: "🔥", label: "Inflation", description: "Why prices rise and how it affects money", href: "/inflation" },
  { emoji: "🏦", label: "Central Banks", description: "How interest rates are controlled", href: "/fed" },
  { emoji: "👷", label: "Employment", description: "What jobs data tells us", href: "/unemployment" },
  { emoji: "🌎", label: "Global Economy", description: "How countries affect each other", href: "/global" },
];

/** Evergreen explainer pages that exist today, kept out of the news feed entirely. */
const ECONOMY_EXPLAINED = [
  { href: "/inflation", label: "What Is Inflation?" },
  { href: "/gdp", label: "What Is GDP?" },
  { href: "/interest-rates", label: "Why Do Interest Rates Matter?" },
  { href: "/fed", label: "How Does the Fed Work?" },
];

const EXPLORE_MORE = [
  { href: "/market-news", label: "Market News" },
  { href: "/investing", label: "Investing" },
  { href: "/banking", label: "Banking" },
  { href: "/personal-finance", label: "Personal Finance" },
  { href: "/reviews", label: "Reviews" },
];

/** Evergreen conceptual FAQs — general finance education, not time-bound facts —
 * used only to top up the CMS-aggregated list below a useful minimum. */
const FALLBACK_FAQS: { question: string; answer: string }[] = [
  {
    question: "What makes an economy grow?",
    answer:
      "Economic growth comes from producing more goods and services over time — driven by a larger or more productive workforce, more capital investment, technological improvement, and gains in efficiency across industries.",
  },
  {
    question: "Why does inflation happen?",
    answer:
      "Inflation happens when overall demand outpaces supply — too much money chasing too few goods — or when input costs (like wages, energy, or materials) rise and businesses pass those costs on to consumers.",
  },
  {
    question: "How do interest rates affect people?",
    answer:
      "Interest rates set the cost of borrowing and the reward for saving. Higher rates make mortgages, car loans, and credit card debt more expensive but pay savers more; lower rates make borrowing cheaper but reduce returns on savings.",
  },
  {
    question: "What causes recessions?",
    answer:
      "Recessions can be triggered by demand shocks (a drop in spending or investment), supply shocks (energy or supply-chain disruptions), financial crises, or aggressive interest-rate increases meant to cool inflation that end up slowing growth too much.",
  },
  {
    question: "How does the Fed control inflation?",
    answer:
      "The Federal Reserve primarily raises or lowers short-term interest rates. Higher rates make borrowing more expensive, which cools spending and investment and, over time, eases upward pressure on prices.",
  },
  {
    question: "Why does GDP matter?",
    answer:
      "GDP is the broadest single measure of economic output — it signals whether the economy is expanding or contracting, which influences hiring, wages, corporate profits, and the policy decisions central banks and governments make.",
  },
  {
    question: "What is monetary policy?",
    answer:
      "Monetary policy is how a central bank manages the money supply and credit conditions — mainly through interest rates and tools like quantitative easing — to keep inflation and employment near its targets.",
  },
];

/** Claims articles into a section while skipping any slug already used by an
 * earlier section — keeps the same guide from appearing twice across the hub. */
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
 * Dedicated Economy hub — evergreen macro explainers kept deliberately
 * separate from Market News' daily coverage: an Economic Snapshot dashboard,
 * concept-based "Start Here" tiles, featured pillar guides, nine real
 * subcategory sections (pillar + supporting), a recency-sorted "Latest
 * Economy Articles" strip, a calendar-styled module built from real published
 * coverage, evergreen "Economy Explained" guides, FAQ, and newsletter — all
 * sourced live from cms-service, falling back to the baked snapshot then
 * bundled demo content exactly like every other topic page. A single shared
 * "claimer" dedupes articles across every section so nothing repeats.
 */
export async function EconomyHub() {
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

  // 2) Every subcategory topic, fetched in parallel.
  const topicEntries = await Promise.all(
    TOPICS.map(async (t) => [t.slug, await fetchTopicArticles(t.slug, TOPIC_FETCH_LIMIT)] as const)
  );
  const byTopic: Record<string, NewsArticle[]> = Object.fromEntries(topicEntries);

  // 3) Featured Guides — the strongest real, live pillar from the overall feed
  //    plus Inflation, the Fed, and GDP, all deduped against everything else.
  const featuredGuides = [
    ...claim(rest, 1),
    ...claim(byTopic.inflation ?? [], 1),
    ...claim(byTopic.fed ?? [], 1),
    ...claim(byTopic.gdp ?? [], 1),
  ];

  // 4) Explore Topics — pillar + supporting grid per subcategory.
  const topicSections = TOPICS.map((t) => ({
    slug: t.slug,
    label: t.label,
    icon: t.icon,
    articles: claim(byTopic[t.slug] ?? [], 5),
  }));

  // 5) Latest Economy Articles — recency-sorted from whatever's left of the main pool.
  const latestArticles = claim(
    [...rest].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    6
  );

  // 6) Economic Calendar — real leftover coverage from the fed/inflation/gdp/
  //    unemployment/indicators pools, not fabricated future release dates.
  const calendarCandidates: EconomicCalendarRow[] = [
    ...(byTopic.indicators ?? []).map((article) => ({ article, eventType: "Economic Indicators" })),
    ...(byTopic.fed ?? []).map((article) => ({ article, eventType: "Federal Reserve" })),
    ...(byTopic.inflation ?? []).map((article) => ({ article, eventType: "Inflation" })),
    ...(byTopic.gdp ?? []).map((article) => ({ article, eventType: "GDP" })),
    ...(byTopic.unemployment ?? []).map((article) => ({ article, eventType: "Employment" })),
  ].sort((a, b) => new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime());
  const calendarRows: EconomicCalendarRow[] = [];
  for (const row of calendarCandidates) {
    const [kept] = claim([row.article], 1);
    if (kept) calendarRows.push(row);
    if (calendarRows.length >= 6) break;
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
    faqSource = staticArticleList().filter((a) => a.category === "Economy");
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

  const totalGuides = articles.length + Object.values(byTopic).reduce((sum, list) => sum + list.length, 0);

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
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground -mt-2 pb-4">
        {totalGuides}+ Economic Guides &middot; Data Explained &middot; Beginner Friendly
      </p>
      <TrustBar />

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
        <EconomicSnapshot indicators={economicIndicators} />

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

        {/* Start Here — concept tiles, not article stand-ins */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Understand the Economy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {START_HERE_CONCEPTS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-900"
              >
                <span className="text-2xl">{c.emoji}</span>
                <h3 className="text-sm font-bold text-foreground">{c.label}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {featuredGuides.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Featured Economy Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredGuides.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Explore Topics — pillar + supporting guides, one section per subcategory */}
        {topicSections.map((section) => (
          <ProductSection
            key={section.slug}
            slug={section.slug}
            label={section.label}
            icon={section.icon}
            articles={section.articles}
          />
        ))}

        {latestArticles.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Latest Economy Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {calendarRows.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              <CalendarClock className="h-4 w-4" />
              Economic Calendar
            </h2>
            <EconomicCalendarTable rows={calendarRows} />
          </section>
        )}

        {/* Economy Explained — evergreen education, never mixed with the news above */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <BookOpen className="h-4 w-4" />
            Economy Explained
          </h2>
          <div className="flex flex-wrap gap-3">
            {ECONOMY_EXPLAINED.map((guide) => (
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
          <h2 className="text-lg font-bold text-foreground">Decode the Economy</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Weekly breakdowns of the data and policy decisions shaping the economy.
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

export default EconomyHub;
