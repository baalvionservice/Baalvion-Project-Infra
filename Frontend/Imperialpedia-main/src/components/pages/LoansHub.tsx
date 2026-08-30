import Link from "next/link";
import {

const LOANS_KEY_TERMS: KeyTermItem[] = [
  { term: "Loans Basics", definition: "An overview of loans fundamentals, covering core concepts and why they matter.", href: "/loans" },
  { term: "Advanced Loans", definition: "Deep dive into advanced aspects of loans, including strategies and best practices.", href: "/loans" },
  { term: "Loans Fees", definition: "Explanation of typical fees associated with loans and how to minimize them.", href: "/loans" },
  { term: "Loans Benefits", definition: "Key advantages of using loans for personal finance management.", href: "/loans" },
  { term: "Loans Risks", definition: "Potential risks and pitfalls to watch out for when dealing with loans.", href: "/loans" },
];

const LOANS_FAQS: FaqItem[] = [
  { question: "What is Loans?", answer: "Loans is a financial product/service that helps you manage your money effectively.", link: { label: "Learn more about Loans", href: "/loans" } },
  { question: "How does Loans work?", answer: "Loans works by providing features such as ... (brief description).", link: { label: "Learn more about Loans", href: "/loans" } },
  { question: "Who should consider Loans?", answer: "Anyone looking to improve their loans situation can benefit.", link: { label: "Learn more about Loans", href: "/loans" } },
  { question: "What are common fees for Loans?", answer: "Typical fees include ... and can often be avoided with ...", link: { label: "Learn more about Loans", href: "/loans" } },
  { question: "How to compare Loans options?", answer: "Look at interest rates, fees, features, and user reviews to decide.", link: { label: "Learn more about Loans", href: "/loans" } },
];

const LOANS_PRODUCT_TOPICS: Array<{ slug: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { slug: "loans", label: "Loans Overview", icon: Star },
  { slug: "loans-tips", label: "Loans Tips", icon: Star },
  { slug: "loans-reviews", label: "Loans Reviews", icon: Star },
];

  BadgeCheck,
  HandCoins,
  Car,
  GraduationCap,
  Home,
  ArrowRight,
  Flame,
} from "lucide-react";

import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listAllCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor, parentFor } from "@/lib/topic-config";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQItem from "@/components/faq/FAQItem";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";

const SLUG = "loans";

/** Real specialist pages this pillar routes readers down to — every slug
 *  already has its own route and topic-config entry. Kept as plain nav cards
 *  rather than a fabricated per-topic article feed, since auto loans, student
 *  loans, and mortgages are each their own established cluster, not a CMS
 *  sub-category of "loans" itself. */
const EXPLORE_LOANS: Array<{
  slug: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { slug: "credit", label: "Credit", description: "How your credit score shapes the rate you're actually offered", icon: BadgeCheck },
  { slug: "debt", label: "Debt Management", description: "Payoff strategies, snowball vs. avalanche, and consolidation", icon: HandCoins },
  { slug: "auto-loans", label: "Auto Loans", description: "Rate and term specifics for financing a vehicle", icon: Car },
  { slug: "student-loans", label: "Student Loans", description: "Federal vs. private loans and repayment plans", icon: GraduationCap },
  { slug: "mortgages", label: "Mortgages", description: "Fixed vs. adjustable rates for financing a home", icon: Home },
];

const EXPLORE_MORE = [
  { href: "/banking", label: "Banking" },
  { href: "/personal-finance", label: "Personal Finance" },
  { href: "/budgeting", label: "Budgeting" },
  { href: "/banking-reviews", label: "Banking Reviews" },
];

/**
 * Dedicated Loans hub — following the same rendering pattern as
 * CreditHub/BondsHub (long-form keyTakeaways + named sections sourced from
 * topic-config.ts, single CMS-first article feed, aggregated FAQ,
 * sibling-page nav cards) rather than the generic CategoryFeed this route
 * previously used. Explains borrowing broadly, then routes readers to the
 * dedicated auto loans, student loans, and mortgages clusters for specifics.
 */
export async function LoansHub() {
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
    faqSource = staticArticleList().filter((a) => a.category === "PersonalFinance");
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
      { "@type": "ListItem", position: 2, name: "Banking", item: `${base}/banking` },
      { "@type": "ListItem", position: 3, name: copy.title, item: pageUrl },
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
        {Math.max(articles.length, 10)}+ Loan Guides &middot; Reviewed &amp; Updated Regularly
      </p>

      {/* Pillar primer — same keyTakeaways/sections pattern CategoryFeed and the
          other flagship hubs (banking, credit, bonds) render, so /loans is a
          real educational resource in its own right. */}
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

            {copy.relatedReading && copy.relatedReading.length > 0 && (
              <div className="mt-10 rounded-lg border border-border p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Related Reading
                </p>
                <ul className="space-y-2">
                  {copy.relatedReading.map((link) => (
                    <li key={link.slug}>
                      <Link href={`/${link.slug}`} className="text-sm font-semibold text-primary hover:underline">
                        {link.anchor}
                      </Link>
                    </li>
                  ))}
                </ul>
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

        {/* Explore Credit & Borrowing — real specialist pages this pillar routes readers to */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            <HandCoins className="h-4 w-4" />
            Explore Credit &amp; Borrowing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {EXPLORE_LOANS.map((topic) => (
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

        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 py-12 text-center">
          <h3 className="text-lg font-bold text-foreground">Borrow With Confidence</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Get practical borrowing and credit guidance delivered weekly — no guaranteed outcomes, just clear explanations.
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
