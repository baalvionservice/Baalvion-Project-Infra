import Link from "next/link";
import {
  HandCoins,
  Smartphone,
  Receipt,
  ArrowRight,
  BookOpen,
} from "lucide-react";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor } from "@/lib/topic-config";
import { reviewSlugs, fetchReviewBySlug } from "@/lib/data/review-live";
import type { ReviewArticle } from "@/types/Review";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import { TrustBar } from "@/components/pages/TrustBar";
import { TopicCard } from "@/components/pages/TopicCard";
import { ProductSection } from "@/components/pages/ProductSection";
import { ComparisonsSection, findComparisons } from "@/components/pages/ComparisonsSection";
import { BuyingGuideCard } from "@/components/pages/reviews/BuyingGuideCard";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQAccordionSection from "@/components/faq/FAQAccordionSection";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";

const SLUG = "reviews";
const TOPIC_FETCH_LIMIT = 12;

/** The real review sub-categories with live pages today. */
const TOPICS: Array<{
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { slug: "loan-reviews", label: "Loan Reviews", icon: HandCoins },
  { slug: "app-reviews", label: "Finance App Reviews", icon: Smartphone },
  { slug: "tax-software", label: "Tax Software Reviews", icon: Receipt },
];

/** "Find The Right Product" concept tiles — each links to a real, live category page. */
const START_HERE_CONCEPTS = [
  { emoji: "💰", label: "Loans", description: "Compare personal loans, mortgages, and lenders.", href: "/loan-reviews" },
  { emoji: "📱", label: "Finance Apps", description: "Review budgeting, investing, and money management apps.", href: "/app-reviews" },
];

const EXPLORE_MORE = [
  { href: "/investing", label: "Investing" },
  { href: "/market-news", label: "Market News" },
  { href: "/banking", label: "Banking" },
  { href: "/personal-finance", label: "Personal Finance" },
  { href: "/economy", label: "Economy" },
];

/** Evergreen conceptual FAQs about the site's own review practice — describes
 * the real methodology/reviewedBy/factCheckedBy fields every review carries,
 * not an invented process. Used only to top up the CMS-aggregated list. */
const FALLBACK_FAQS: { question: string; answer: string }[] = [
  {
    question: "How does Imperialpedia review products?",
    answer:
      "Every review lists the specific criteria we evaluated (fees, features, eligibility, and more) in its methodology section, along with who reviewed it and who fact-checked it before publishing. See our editorial policy and fact-checking pages for our full editorial standards.",
  },
  {
    question: "Are financial reviews independent?",
    answer:
      "Our ratings are based on our own editorial evaluation criteria, not on which companies pay to be featured. Some links may earn us a commission if you open an account, which we disclose on the relevant reviews — that compensation does not change our ratings.",
  },
  {
    question: "What should I compare before choosing a broker?",
    answer:
      "Look at commissions and fees, account minimums, available investment types, platform and mobile app quality, research and education tools, and customer support — the same criteria we use in our broker reviews.",
  },
  {
    question: "Is the cheapest financial product always best?",
    answer:
      "Not necessarily. A $0-commission broker with weak research tools, or a no-fee bank with a poor mobile app, can cost you more in time or missed opportunities than a slightly pricier option with better service — cost is one factor among several.",
  },
  {
    question: "Should beginners use robo-advisors?",
    answer:
      "Robo-advisors can be a good fit for beginners who want a diversified, professionally-constructed portfolio without picking individual investments themselves. Low- or no-minimum options make it easy to start small while you learn.",
  },
  {
    question: "How do bank reviews work?",
    answer:
      "We evaluate banks on fees, interest rates, account features, digital experience, and customer service, comparing online-only banks against traditional branch banks so you can weigh convenience against in-person support.",
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
 * Dedicated Reviews hub — product reviews, platform comparisons, rankings,
 * and buying guides only. This replaces the previous implementation, which
 * pulled from the generic site-wide news feed (`getPublishedNews()` /
 * `newsArticles`) and so surfaced ordinary market-news headlines (Fed
 * decisions, earnings, crypto prices) on a page that should only ever show
 * reviews — that daily-news content belongs on Market News, Economy, and
 * Crypto instead. The main feed here is scoped to the real `reviews` CMS
 * category, with the same fallback chain used by every other topic page. A
 * single shared "claimer" dedupes articles across every section.
 */
export async function ReviewsHub() {
  const copy = topicCopy(SLUG);

  // 1) Main feed — scoped to the reviews category only, not general news.
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
    articles = filtered.length ? filtered : [];
  }

  const claim = makeClaimer();

  const featured = articles.find((a) => a.featured) ?? articles[0];
  if (featured) claim([featured], 1);
  const rest = articles.filter((a) => a !== featured);
  const sidebarArticles = claim(rest, 3);

  // 2) Every review sub-category, fetched in parallel.
  const topicEntries = await Promise.all(
    TOPICS.map(async (t) => [t.slug, await fetchTopicArticles(t.slug, TOPIC_FETCH_LIMIT)] as const)
  );
  const byTopic: Record<string, NewsArticle[]> = Object.fromEntries(topicEntries);

  // 3) The real "Best X Compared" registry — genuine provider comparisons,
  //    real editorial scores, never fabricated per-company ratings.
  const allReviews = (await Promise.all(reviewSlugs.map((slug) => fetchReviewBySlug(slug)))).filter(
    (r): r is ReviewArticle => Boolean(r)
  );

  // 4) Topic sections — pillar + supporting grid per sub-category.
  const topicSections = TOPICS.map((t) => ({
    slug: t.slug,
    label: t.label,
    icon: t.icon,
    articles: claim(byTopic[t.slug] ?? [], 5),
  }));

  // 5) Comparisons — real "vs." pieces found across every fetched pool, deduped.
  const comparisonCandidates = [...rest, ...Object.values(byTopic).flat()];
  const comparisons = claim(findComparisons(comparisonCandidates, 6), 6);

  // 6) FAQ — aggregated from the CMS's own per-article FAQ data, topped up with
  //    evergreen conceptual questions (not time-bound facts) when coverage is thin.
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const { items } = await listCmsContent({ categorySlug: SLUG, contentType: "article", limit: 12 });
    faqSource = items.map((raw) => cmsContentToArticle(raw));
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    faqSource = staticArticleList().filter((a) => a.category === "Guides");
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

  const totalGuides =
    articles.length +
    Object.values(byTopic).reduce((sum, list) => sum + list.length, 0) +
    allReviews.reduce((sum, r) => sum + r.providers.length, 0);

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
      itemListElement: [...articles, ...allReviews].slice(0, 25).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: a.title,
        // Reviews resolve at the bare slug; guides/news use their real canonical route.
        url: `${base}${"pageType" in a ? `/${a.slug}` : newsArticleHref(a)}`,
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
        {totalGuides}+ Reviews &amp; Comparisons &middot; Expert Analysis &middot; Updated Regularly
      </p>
      <TrustBar />

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
        {/* Find The Right Product — concept tiles, not article stand-ins */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Find the Right Financial Product
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

        {/* Broker / Bank / Credit Card / Loan / Insurance / Robo-Advisor / App / Tax / Advisor Reviews */}
        {topicSections.map((section) => (
          <ProductSection
            key={section.slug}
            slug={section.slug}
            label={section.label}
            icon={section.icon}
            articles={section.articles}
          />
        ))}

        <ComparisonsSection articles={comparisons} heading="Comparison Tools" />

        {/* Buying Guides — every real "Best X Compared" pillar page, real scores only */}
        {allReviews.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              <BookOpen className="h-4 w-4" />
              Financial Buying Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allReviews.map((r) => (
                <BuyingGuideCard key={r.slug} review={r} />
              ))}
            </div>
          </section>
        )}

        {!featured && allReviews.length === 0 && topicSections.every((s) => s.articles.length === 0) && (
          <p className="py-16 text-center text-muted-foreground">
            No reviews published yet — check back soon.
          </p>
        )}

        {/* FAQ */}
        <FAQAccordionSection faqs={faqs} />

        {/* Newsletter signup */}
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 py-12 text-center">
          <h3 className="text-lg font-bold text-foreground">Smarter Money Choices</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Fresh reviews, rankings, and comparisons — sent straight to your inbox.
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
