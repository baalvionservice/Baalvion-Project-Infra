import Link from "next/link";
import { Bitcoin, LineChart, TrendingUp, ArrowRight, Flame } from "lucide-react";

const CRYPTO_KEY_TERMS: KeyTermItem[] = [
  { term: "Crypto Basics", definition: "An overview of crypto fundamentals, covering core concepts and why they matter.", href: "/crypto" },
  { term: "Advanced Crypto", definition: "Deep dive into advanced aspects of crypto, including strategies and best practices.", href: "/crypto" },
  { term: "Crypto Fees", definition: "Explanation of typical fees associated with crypto and how to minimize them.", href: "/crypto" },
  { term: "Crypto Benefits", definition: "Key advantages of using crypto for personal finance management.", href: "/crypto" },
  { term: "Crypto Risks", definition: "Potential risks and pitfalls to watch out for when dealing with crypto.", href: "/crypto" },
];

const CRYPTO_FAQS: FaqItem[] = [
  { question: "What is Crypto?", answer: "Crypto is a financial product/service that helps you manage your money effectively.", link: { label: "Learn more about Crypto", href: "/crypto" } },
  { question: "How does Crypto work?", answer: "Crypto works by providing features such as ... (brief description).", link: { label: "Learn more about Crypto", href: "/crypto" } },
  { question: "Who should consider Crypto?", answer: "Anyone looking to improve their crypto situation can benefit.", link: { label: "Learn more about Crypto", href: "/crypto" } },
  { question: "What are common fees for Crypto?", answer: "Typical fees include ... and can often be avoided with ...", link: { label: "Learn more about Crypto", href: "/crypto" } },
  { question: "How to compare Crypto options?", answer: "Look at interest rates, fees, features, and user reviews to decide.", link: { label: "Learn more about Crypto", href: "/crypto" } },
];

const CRYPTO_PRODUCT_TOPICS: Array<{ slug: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { slug: "crypto", label: "Crypto Overview", icon: Star },
  { slug: "crypto-tips", label: "Crypto Tips", icon: Star },
  { slug: "crypto-reviews", label: "Crypto Reviews", icon: Star },
];


import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listAllCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor, parentFor } from "@/lib/topic-config";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQAccordionSection from "@/components/faq/FAQAccordionSection";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";

const SLUG = "crypto";

/** Real, existing routes this pillar links out to — the sibling Cryptocurrency
 *  fundamentals hub, plus the two parent verticals crypto sits under in the
 *  nav (Markets and Investing). No invented sub-category pages: the repo has
 *  no dedicated bitcoin/defi/stablecoin routes today, so this stays a short,
 *  honest list rather than a fabricated grid of cards. */
const EXPLORE_CRYPTO: Array<{
  slug: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    slug: "cryptocurrency",
    label: "Cryptocurrency",
    description: "Bitcoin, Ethereum, DeFi, and the blockchain infrastructure behind digital assets",
    icon: Bitcoin,
  },
  {
    slug: "market-news",
    label: "Markets",
    description: "Live market news, earnings, and the economic calendar",
    icon: LineChart,
  },
  {
    slug: "investing",
    label: "Investing",
    description: "How crypto fits alongside stocks, bonds, and other investment categories",
    icon: TrendingUp,
  },
];

const EXPLORE_MORE = [
  { href: "/banking", label: "Banking" },
  { href: "/personal-finance", label: "Personal Finance" },
  { href: "/economy", label: "Economy" },
  { href: "/reviews", label: "Reviews" },
];

/**
 * Dedicated Crypto hub — the primary /crypto educational pillar, following the
 * same rendering pattern as CreditHub/BankingHub/InvestingHub (long-form
 * keyTakeaways + named sections sourced from topic-config.ts, single
 * CMS-first article feed, aggregated FAQ). /cryptocurrency remains the
 * sibling Bitcoin/Ethereum/DeFi fundamentals hub this page links down to,
 * rather than being folded into a single mega-page.
 */
export async function CryptoHub() {
  const copy = topicCopy(SLUG);

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
    articles = cat ? newsArticles.filter((a) => a.category === cat) : [];
  }

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);
  const sidebarArticles = rest.slice(0, 3);

  const trending = [...articles]
    .sort((a, b) => {
      if (a.views != null && b.views != null) return b.views - a.views;
      if (a.views != null) return -1;
      if (b.views != null) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 4);

  // FAQ — aggregated from the CMS's own per-article FAQ data, topped up with
  // this page's own curated FAQs (see topic-config.ts) when coverage is thin.
  let faqSource: { faq?: { question: string; answer: string }[] }[] = [];
  try {
    const items = await listAllCmsContent({ categorySlug: SLUG, contentType: "article" });
    faqSource = items.map((raw) => cmsContentToArticle(raw));
  } catch {
    faqSource = [];
  }
  if (!faqSource.some((a) => a.faq?.length)) {
    faqSource = staticArticleList().filter((a) => a.category === "Crypto");
  }
  const seenQuestions = new Set<string>();
  const faqs = [...(copy.faqs ?? []), ...faqSource.flatMap((a) => a.faq ?? [])].filter((f) => {
    const key = f.question.trim().toLowerCase();
    if (seenQuestions.has(key)) return false;
    seenQuestions.add(key);
    return true;
  });

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
        {Math.max(articles.length, 10)}+ Crypto Guides &middot; Reviewed &amp; Updated Regularly
      </p>

      {/* Pillar primer — same keyTakeaways/sections pattern CategoryFeed and the
          other flagship hubs (banking, credit, investing) render, so /crypto is a
          real beginner educational resource in its own right, not just a page of
          links or market-mechanics trivia. */}
      {(copy.keyTakeaways?.length || copy.sections?.length) ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl pb-12">
            {copy.keyTakeaways && copy.keyTakeaways.length > 0 && (
              <div className="mb-8 rounded-lg border border-border bg-muted/30 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Key Takeaways
                </p>
                <ul className="space-y-2">
                  {copy.keyTakeaways.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground">
                      <span aria-hidden="true" className="text-primary">&bull;</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {copy.sections && copy.sections.length > 0 && (
              <div className="space-y-8">
                {copy.sections.map((section, i) => (
                  <div key={i}>
                    <h2 className="text-lg font-bold text-foreground mb-3">{section.heading}</h2>
                    <div className="space-y-3">
                      {section.body.map((paragraph, j) => (
                        <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
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

        {/* Explore Crypto — real sibling/parent hubs this pillar links down to */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <Bitcoin className="h-4 w-4" />
            Explore Crypto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {EXPLORE_CRYPTO.map((topic) => (
              <Link
                key={topic.slug}
                href={`/${topic.slug}`}
                className="group flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-900"
              >
                <topic.icon className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-900" />
                <p className="text-sm font-bold text-foreground">{topic.label}</p>
                <p className="text-xs text-muted-foreground">{topic.description}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:underline">
                  Read more
                  <ArrowRight className="h-3 w-3" />
                </span>
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
        <FAQAccordionSection faqs={faqs} />

        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 py-12 text-center">
          <h3 className="text-lg font-bold text-foreground">Stay Ahead of the Markets</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Get practical crypto and market guidance delivered weekly — no guaranteed outcomes, just clear explanations.
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

export default CryptoHub;
