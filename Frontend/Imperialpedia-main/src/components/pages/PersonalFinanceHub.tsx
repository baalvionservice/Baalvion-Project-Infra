import Link from "next/link";
import {
  PieChart,
  PiggyBank,
  TrendingDown,
  Gauge,
  Target,
  Umbrella,
  Flame,
  Wallet,
  Star,
  Calculator,
  BookOpen,
  Newspaper,
  ArrowRight,
} from "lucide-react";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor } from "@/lib/topic-config";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import { TrustBar } from "@/components/pages/TrustBar";
import { TopicCard } from "@/components/pages/TopicCard";
import { ProductSection } from "@/components/pages/ProductSection";
import { ComparisonsSection, findComparisons } from "@/components/pages/ComparisonsSection";
import { ArticleCard } from "@/app/news/NewsArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQItem from "@/components/faq/FAQItem";
import { env } from "@/config/env";

const SLUG = "personal-finance";
const TOPIC_FETCH_LIMIT = 12;

/** The 8 real topics behind the Personal Finance mega-menu (Navbar.tsx). */
const TOPICS: Array<{
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { slug: "budgeting", label: "Budgeting", icon: PieChart },
  { slug: "savings", label: "Saving", icon: PiggyBank },
  { slug: "debt", label: "Debt Management", icon: TrendingDown },
  { slug: "credit", label: "Credit Scores", icon: Gauge },
  { slug: "planning", label: "Financial Planning", icon: Target },
  { slug: "retirement", label: "Retirement Planning", icon: Umbrella },
  { slug: "financial-independence", label: "Financial Independence", icon: Flame },
  { slug: "money-management", label: "Money Management", icon: Wallet },
];

/** Real review categories relevant to personal-finance decisions (advisors, robo-advisors, tax software, insurance). */
const RELATED_REVIEWS: Array<{ slug: string; label: string }> = [
  { slug: "advisor-reviews", label: "Advisor Reviews" },
  { slug: "robo-advisors", label: "Robo-Advisors" },
  { slug: "tax-software", label: "Tax Software" },
  { slug: "insurance-reviews", label: "Insurance Reviews" },
];

/** Real calculator pages that exist today (see src/services/mock-api/calculators.ts). */
const CALCULATORS = [
  { href: "/financial-tools/compound-interest", label: "Compound Interest Calculator" },
  { href: "/financial-tools/inflation", label: "Inflation Calculator" },
  { href: "/financial-tools/investment", label: "Investment Calculator" },
  { href: "/financial-tools", label: "All Financial Tools" },
];

/** Evergreen explainer pages that exist today, kept out of the news feed entirely. */
const MONEY_GUIDES = [
  { href: "/emergency-fund", label: "Building an Emergency Fund" },
  { href: "/wealth-building", label: "Wealth-Building Strategies" },
  { href: "/budget-rules", label: "Budget Rules Compared" },
  { href: "/debt-repayment-strategies", label: "Debt Repayment Strategies" },
  { href: "/estate-planning", label: "Estate Planning Basics" },
];

const EXPLORE_MORE = [
  { href: "/investing", label: "Investing" },
  { href: "/market-news", label: "Market News" },
  { href: "/banking", label: "Banking" },
  { href: "/economy", label: "Economy" },
  { href: "/reviews", label: "Reviews" },
];

/** Evergreen conceptual FAQs — general finance education, not time-bound facts —
 * used only to top up the CMS-aggregated list below a useful minimum. */
const FALLBACK_FAQS: { question: string; answer: string }[] = [
  {
    question: "What is the 50/30/20 budgeting rule?",
    answer:
      "It's a simple framework for splitting after-tax income: roughly 50% toward needs (housing, food, utilities), 30% toward wants, and 20% toward savings and debt repayment. It's a starting point to adjust, not a strict requirement.",
  },
  {
    question: "How much should I have in an emergency fund?",
    answer:
      "A common guideline is 3–6 months of essential living expenses kept in an easily accessible account, so a job loss or unexpected bill doesn't force you into high-interest debt. People with less stable income often aim for the higher end of that range.",
  },
  {
    question: "Should I pay off debt before investing?",
    answer:
      "It depends on the interest rate. High-interest debt (like credit cards) usually costs more than typical investment returns, so paying it down first tends to win mathematically. Lower-rate debt (like some mortgages) leaves more room to invest alongside repayment.",
  },
  {
    question: "How is my credit score calculated?",
    answer:
      "Scoring models weigh payment history, amounts owed (credit utilization), length of credit history, new credit inquiries, and the mix of credit types. Payment history and utilization typically carry the most weight.",
  },
  {
    question: "When should I start saving for retirement?",
    answer:
      "As early as possible — compounding gives money more time to grow, so contributions in your 20s and 30s tend to have an outsized impact on the final balance compared to the same contributions made later.",
  },
  {
    question: "What's a good savings rate to aim for?",
    answer:
      "Many planners suggest saving at least 15–20% of gross income for long-term goals like retirement, though the right number depends on your age, existing savings, and how soon you want to reach your goals.",
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
 * Dedicated Personal Finance hub — a NerdWallet/Investopedia-style money
 * knowledge center: a topic dashboard, curated "Start Here" picks, eight real
 * per-topic sections (pillar + supporting guides), related product reviews,
 * real "vs." comparison pieces, working calculators, a recency-sorted news
 * strip kept separate from evergreen guides, FAQ, and newsletter — all
 * sourced live from cms-service, falling back to the baked snapshot then
 * bundled demo content exactly like every other topic page. A single shared
 * "claimer" dedupes articles across every section so nothing repeats.
 */
export async function PersonalFinanceHub() {
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

  // 2) Every topic + related-review category, fetched in parallel.
  const ALL_TOPIC_SLUGS = [...TOPICS.map((t) => t.slug), ...RELATED_REVIEWS.map((t) => t.slug)];
  const topicEntries = await Promise.all(
    ALL_TOPIC_SLUGS.map(async (slug) => [slug, await fetchTopicArticles(slug, TOPIC_FETCH_LIMIT)] as const)
  );
  const byTopic: Record<string, NewsArticle[]> = Object.fromEntries(topicEntries);

  // 3) "Start Here" — a beginner overview pick plus the lead guide from the
  //    three most-visited topics, all real, all deduped against everything else.
  const startHere = [
    ...claim(rest, 1),
    ...claim(byTopic.budgeting ?? [], 1),
    ...claim(byTopic.savings ?? [], 1),
    ...claim(byTopic.debt ?? [], 1),
  ];

  // 4) Topic sections — pillar + supporting grid per topic.
  const topicSections = TOPICS.map((t) => ({
    slug: t.slug,
    label: t.label,
    icon: t.icon,
    articles: claim(byTopic[t.slug] ?? [], 5),
  }));

  // 5) Related Reviews — real counts + links, kept entirely separate from the guides above.
  const reviewCards = RELATED_REVIEWS.map((t) => ({ ...t, count: byTopic[t.slug]?.length ?? 0 }));

  // 6) Comparisons — real "vs." pieces found across every fetched pool, deduped.
  const comparisonCandidates = [...rest, ...Object.values(byTopic).flat()];
  const comparisons = claim(findComparisons(comparisonCandidates, 6), 6);

  // 7) Personal Finance News — a small recency-sorted strip, visually and
  //    structurally separate from the evergreen Money Guides section below.
  const latestNews = claim(
    [...rest].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    4
  );

  // 8) Dashboard counts — the fetched-array length, honestly labelled "N+" when
  //    it hits the fetch cap (there may be more than we pulled for the count).
  const dashboardCards = TOPICS.map((t) => ({
    slug: t.slug,
    label: t.label,
    icon: t.icon,
    description: topicCopy(t.slug).description,
    count: byTopic[t.slug]?.length ?? 0,
  }));

  // 9) FAQ — aggregated from the CMS's own per-article FAQ data, topped up with
  //    evergreen conceptual questions (not time-bound facts) when coverage is thin.
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const { items } = await listCmsContent({ categorySlug: SLUG, contentType: "article", limit: 12 });
    faqSource = items.map(cmsContentToArticle);
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    faqSource = staticArticleList().filter((a) => a.category === "PersonalFinance");
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

      <HeadingSection tag={copy.tag} title={copy.title} description={copy.description} />
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground -mt-2 pb-4">
        {totalGuides}+ Personal Finance Guides &middot; Reviewed &amp; Updated Regularly
      </p>
      <TrustBar />

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
        {/* Topic dashboard */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Personal Finance Topics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {dashboardCards.map((card) => (
              <TopicCard
                key={card.slug}
                href={`/${card.slug}`}
                label={card.label}
                description={card.description}
                count={card.count}
                icon={card.icon}
              />
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

        {startHere.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Start Here
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {startHere.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* Personal Finance Topics — pillar + supporting guides, one section per topic */}
        {topicSections.map((section) => (
          <ProductSection
            key={section.slug}
            slug={section.slug}
            label={section.label}
            icon={section.icon}
            articles={section.articles}
          />
        ))}

        {/* Related Reviews — a dedicated area, never mixed with the guides above */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <Star className="h-4 w-4" />
            Related Reviews
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reviewCards.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="group flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-900"
              >
                <p className="text-sm font-bold text-foreground">{r.label}</p>
                {r.count > 0 && (
                  <p className="text-xs text-gray-400">
                    {r.count} review{r.count === 1 ? "" : "s"}
                  </p>
                )}
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:underline">
                  Compare
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <ComparisonsSection articles={comparisons} heading="Money Comparisons" />

        {/* Calculators — real, working tools only */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <Calculator className="h-4 w-4" />
            Money Calculators
          </h2>
          <div className="flex flex-wrap gap-3">
            {CALCULATORS.map((tool) => (
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

        {/* Personal Finance News — recency-sorted, deliberately separate from the evergreen guides below */}
        {latestNews.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              <Newspaper className="h-4 w-4" />
              Personal Finance News
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestNews.map((article) => (
                <Link key={article.id} href={`/${article.slug}`} className="group block">
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

        {/* Money Guides — evergreen education, never mixed with news */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <BookOpen className="h-4 w-4" />
            Money Guides
          </h2>
          <div className="flex flex-wrap gap-3">
            {MONEY_GUIDES.map((guide) => (
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
          <h2 className="text-lg font-bold text-foreground">Master Your Money</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Practical budgeting, saving, and debt-payoff strategies, delivered weekly.
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

export default PersonalFinanceHub;
