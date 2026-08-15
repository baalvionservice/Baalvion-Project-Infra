import Link from "next/link";
import {
  Wallet,
  FileSpreadsheet,
  PiggyBank,
  Receipt,
  CalendarDays,
  Users,
  GraduationCap,
  Scale,
  PieChart,
  ShieldAlert,
  CreditCard,
  Mail,
  Smartphone,
  Leaf,
  Flame,
  Calculator,
  ArrowRight,
} from "lucide-react";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor, parentFor } from "@/lib/topic-config";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import { InvestingTopicExplorer, type InvestingTopic } from "@/components/pages/InvestingTopicExplorer";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import { newsArticleHref } from "@/lib/data/article-url";
import FAQItem from "@/components/faq/FAQItem";
import { env } from "@/config/env";

const SLUG = "budgeting";

/**
 * Budgeting sub-topic pillars — each backed by its own editorial category
 * (see `scripts/generate-static-content.cjs` PACKS + `content/<pillar>/articles`).
 * 'budget-rules' and 'debt' deliberately reuse those existing topic-config
 * slugs instead of minting near-duplicate categories.
 */
const BUDGETING_TOPICS: Array<InvestingTopic & { icon: React.ComponentType<{ className?: string }> }> = [
  { slug: "budgeting-basics", label: "Budgeting Basics", icon: Wallet },
  { slug: "monthly-budget", label: "Monthly Budget", icon: CalendarDays },
  { slug: "budget-rules", label: "Budget Methods", icon: Scale },
  { slug: "saving-money", label: "Saving Money", icon: PiggyBank },
  { slug: "family-budget", label: "Family Budget", icon: Users },
  { slug: "student-budget", label: "Student Budget", icon: GraduationCap },
  { slug: "debt", label: "Debt Payoff", icon: CreditCard },
  { slug: "emergency-fund", label: "Emergency Fund", icon: ShieldAlert },
  { slug: "budgeting-apps", label: "Budget Apps", icon: Smartphone },
  { slug: "advanced-budgeting", label: "Advanced Budgeting", icon: Receipt },
];

/** Category display names used across the budgeting pillars — see PACKS in
 *  scripts/generate-static-content.cjs. Used to pull budgeting-specific FAQs
 *  out of the baked article snapshot (which spans every editorial pack). */
const BUDGETING_CATEGORY_NAMES = new Set([
  "Budgeting Basics",
  "Monthly Budget",
  "Budget Rules",
  "Saving Money",
  "Family Budget",
  "Student Budget",
  "Debt Management",
  "Emergency Fund",
  "Budgeting Apps",
  "Advanced Budgeting",
]);

/** Browse chips — several map onto the same pillar page (e.g. "Cash Envelope"
 *  and "Zero-Based Budget" both live under the Budget Methods pillar) rather
 *  than each minting its own near-empty category. A couple point straight at
 *  an existing deep-dive article instead of a category page. */
const BROWSE_CHIPS: Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: "Budgeting Basics", href: "/budgeting-basics", icon: Wallet },
  { label: "Budget Templates", href: "/budgeting-basics", icon: FileSpreadsheet },
  { label: "Saving Money", href: "/saving-money", icon: PiggyBank },
  { label: "Expense Tracking", href: "/budgeting-apps", icon: Receipt },
  { label: "Monthly Budget", href: "/monthly-budget", icon: CalendarDays },
  { label: "Family Budget", href: "/family-budget", icon: Users },
  { label: "Student Budget", href: "/student-budget", icon: GraduationCap },
  { label: "Zero-Based Budget", href: "/budget-rules", icon: Scale },
  { label: "50/30/20 Rule", href: "/budget-rules", icon: PieChart },
  { label: "Emergency Fund", href: "/emergency-fund", icon: ShieldAlert },
  { label: "Debt Payoff", href: "/debt", icon: CreditCard },
  { label: "Cash Envelope", href: "/budget-rules", icon: Mail },
  { label: "Budget Apps", href: "/budgeting-apps", icon: Smartphone },
  { label: "Frugal Living", href: "/saving-money", icon: Leaf },
];

const BUDGETING_TOOLS = [
  { href: "/budget-rules", label: "50/30/20 Calculator" },
  { href: "/financial-tools", label: "All Financial Tools" },
];

const EXPLORE_MORE = [
  { href: "/investing", label: "Investing" },
  { href: "/economy", label: "Economy" },
  { href: "/banking", label: "Banking" },
  { href: "/personal-finance", label: "Personal Finance" },
  { href: "/reviews", label: "Reviews" },
];

/** CMS-first fetch for a single pillar slug, same fallback chain as CategoryFeed. */
async function fetchTopicArticles(slug: string, limit: number): Promise<NewsArticle[]> {
  let items = await getCategoryArticles(slug, limit);
  if (items.length) return items;

  items = staticCategoryNews(slug).slice(0, limit);
  if (items.length) return items;

  const cat = staticCategoryFor(slug);
  return (cat ? newsArticles.filter((a) => a.category === cat) : []).slice(0, limit);
}

/**
 * Dedicated Budgeting hub — mirrors InvestingHub's structure and CMS-first
 * fallback chain, but instead of one flat category, the main feed is the
 * union of ten dedicated budgeting pillars (Budgeting Basics, Monthly Budget,
 * Budget Methods, Saving Money, Family Budget, Student Budget, Debt Payoff,
 * Emergency Fund, Budget Apps, Advanced Budgeting) so both the hub page and
 * each pillar's own topic page (/budgeting-basics, /monthly-budget, ...) are
 * populated with real, dedicated editorial content rather than one grab-bag
 * category.
 */
export async function BudgetingHub() {
  const copy = topicCopy(SLUG);

  // 1) Per-pillar live sets — fetched from the CMS (falling back to the baked
  //    snapshot) in parallel. Powers the topic explorer tabs, the pillar
  //    chips, and — unioned together — the main feed below.
  const topicEntries = await Promise.all(
    BUDGETING_TOPICS.map(async (t) => [t.slug, await fetchTopicArticles(t.slug, 8)] as const)
  );
  const articlesByTopic: Record<string, NewsArticle[]> = Object.fromEntries(topicEntries);

  // 2) Main feed — union of every pillar, de-duplicated by slug, newest first.
  const seenSlugs = new Set<string>();
  const articles: NewsArticle[] = Object.values(articlesByTopic)
    .flat()
    .filter((a) => (seenSlugs.has(a.slug) ? false : (seenSlugs.add(a.slug), true)))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const isLive = articles.length > 0;

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);
  const sidebarArticles = rest.slice(0, 3);

  // article.category is a coarse NewsCategory bucket that budgeting's pillar categories
  // don't belong to, so it renders as the generic "Editorial" catch-all — look the real
  // pillar label up by the article's own categorySlug instead (see also
  // InvestingTopicExplorer, which needed the same fix for the tab-filtered grid below).
  const budgetingLabelBySlug = Object.fromEntries(BUDGETING_TOPICS.map((t) => [t.slug, t.label]));
  const labelFor = (a: NewsArticle) => (a.categorySlug && budgetingLabelBySlug[a.categorySlug]) || undefined;

  // 3) "Popular this week" — ranked from the combined feed by tracked view
  //    count, falling back to publish recency. No curated picks.
  const trending = [...articles]
    .sort((a, b) => {
      if (a.views != null && b.views != null) return b.views - a.views;
      if (a.views != null) return -1;
      if (b.views != null) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 4);

  // 4) "Start Budgeting" — the lead live article from each beginner-facing
  //    pillar, in a deliberate learning-path order. Updates automatically as
  //    the CMS publishes new coverage; nothing here is a fixed slug.
  const START_BUDGETING_ORDER = [
    "budgeting-basics",
    "monthly-budget",
    "saving-money",
    "emergency-fund",
    "debt",
    "budgeting-apps",
  ];
  const startBudgetingSteps = START_BUDGETING_ORDER.map((slug) => {
    const topic = BUDGETING_TOPICS.find((t) => t.slug === slug)!;
    return { topic, article: articlesByTopic[slug]?.[0] };
  }).filter((s): s is { topic: (typeof BUDGETING_TOPICS)[number]; article: NewsArticle } => !!s.article);

  // Every article already surfaced above (featured, sidebar, trending, Start
  // Budgeting) is excluded from the "Explore Budgeting" grid/tabs below — the
  // same article was previously appearing twice on the page (once in a rail,
  // again in the topic explorer), which read as duplicated content.
  const shownSlugs = new Set<string>([
    ...(featured ? [featured.slug] : []),
    ...sidebarArticles.map((a) => a.slug),
    ...trending.map((a) => a.slug),
    ...startBudgetingSteps.map((s) => s.article.slug),
  ]);
  const gridArticles = rest.filter((a) => !shownSlugs.has(a.slug));
  const explorerArticlesByTopic = Object.fromEntries(
    Object.entries(articlesByTopic).map(([slug, items]) => [
      slug,
      items.filter((a) => !shownSlugs.has(a.slug)),
    ])
  );

  // 5) FAQ — aggregated from the CMS's own per-article FAQ data
  //    (customFields.faq), not a hardcoded question list.
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const results = await Promise.all(
      BUDGETING_TOPICS.map((t) => listCmsContent({ categorySlug: t.slug, contentType: "article", limit: 12 }))
    );
    faqSource = results.flatMap((r) => r.items.map((raw) => cmsContentToArticle(raw)));
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    faqSource = staticArticleList().filter((a) => BUDGETING_CATEGORY_NAMES.has(a.category));
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
    .slice(0, 15);

  // ── SEO: CollectionPage + ItemList + Breadcrumb + FAQPage structured data ──
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
  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <HeadingSection tag={copy.tag} eyebrow={parentFor(SLUG)} title={copy.title} description={copy.description} />
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground -mt-2 pb-6">
        {Math.max(articles.length, 20)}+ Budgeting Articles &middot; Updated Daily
      </p>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
        {/* Browse Budgeting Topics */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Browse Budgeting Topics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {BROWSE_CHIPS.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="group flex flex-col items-center gap-2 rounded-lg border border-gray-100 px-3 py-5 text-center transition-colors hover:border-gray-900 hover:bg-gray-50"
              >
                <chip.icon className="h-6 w-6 text-gray-500 transition-colors group-hover:text-gray-900" />
                <span className="text-xs font-semibold text-foreground">{chip.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {featured && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <aside className="flex flex-col">
              {sidebarArticles.map((article) => (
                <HorizontalArticleCard key={article.id} article={article} categoryLabel={labelFor(article)} />
              ))}
            </aside>
            <div className="lg:col-span-2">
              <FeaturedArticleCard article={featured} categoryLabel={labelFor(featured)} />
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
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Start Budgeting learning path */}
        {startBudgetingSteps.length > 0 && (
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Start Budgeting
            </h3>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {startBudgetingSteps.map((step, i) => (
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

        {/* Topic explorer — real, CMS-fetched budgeting pillars. */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Explore {isLive ? copy.title : "News"}
          </h3>
          <InvestingTopicExplorer
            topics={BUDGETING_TOPICS.map(({ slug, label }) => ({ slug, label }))}
            articlesByTopic={explorerArticlesByTopic}
            allArticles={gridArticles}
          />
        </section>

        {/* Related tools */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <Calculator className="h-4 w-4" />
            Budgeting Tools
          </h3>
          <div className="flex flex-wrap gap-3">
            {BUDGETING_TOOLS.map((tool) => (
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
          <h3 className="text-lg font-bold text-foreground">Stay in Control of Your Money</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Get budgeting tips, money-saving ideas, and personal finance insights delivered weekly.
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

export default BudgetingHub;
