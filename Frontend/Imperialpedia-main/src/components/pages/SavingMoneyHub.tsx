import Link from "next/link";
import { ArrowRight, BookOpen, Flame } from "lucide-react";

const SAVINGMONEY_KEY_TERMS: KeyTermItem[] = [
  { term: "SavingMoney Basics", definition: "An overview of savingmoney fundamentals, covering core concepts and why they matter.", href: "/savingmoney" },
  { term: "Advanced SavingMoney", definition: "Deep dive into advanced aspects of savingmoney, including strategies and best practices.", href: "/savingmoney" },
  { term: "SavingMoney Fees", definition: "Explanation of typical fees associated with savingmoney and how to minimize them.", href: "/savingmoney" },
  { term: "SavingMoney Benefits", definition: "Key advantages of using savingmoney for personal finance management.", href: "/savingmoney" },
  { term: "SavingMoney Risks", definition: "Potential risks and pitfalls to watch out for when dealing with savingmoney.", href: "/savingmoney" },
];

const SAVINGMONEY_FAQS: FaqItem[] = [
  { question: "What is SavingMoney?", answer: "SavingMoney is a financial product/service that helps you manage your money effectively.", link: { label: "Learn more about SavingMoney", href: "/savingmoney" } },
  { question: "How does SavingMoney work?", answer: "SavingMoney works by providing features such as ... (brief description).", link: { label: "Learn more about SavingMoney", href: "/savingmoney" } },
  { question: "Who should consider SavingMoney?", answer: "Anyone looking to improve their savingmoney situation can benefit.", link: { label: "Learn more about SavingMoney", href: "/savingmoney" } },
  { question: "What are common fees for SavingMoney?", answer: "Typical fees include ... and can often be avoided with ...", link: { label: "Learn more about SavingMoney", href: "/savingmoney" } },
  { question: "How to compare SavingMoney options?", answer: "Look at interest rates, fees, features, and user reviews to decide.", link: { label: "Learn more about SavingMoney", href: "/savingmoney" } },
];

const SAVINGMONEY_PRODUCT_TOPICS: Array<{ slug: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { slug: "savingmoney", label: "SavingMoney Overview", icon: Star },
  { slug: "savingmoney-tips", label: "SavingMoney Tips", icon: Star },
  { slug: "savingmoney-reviews", label: "SavingMoney Reviews", icon: Star },
];


import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles, listAllCmsContent, cmsContentToArticle } from "@/services/data/cms-public";
import { staticCategoryNews, staticArticleList } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor, parentFor } from "@/lib/topic-config";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import { ArticleCard } from "@/app/news/NewsArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import FAQItem from "@/components/faq/FAQItem";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";

const SLUG = "saving-money";

const EXPLORE_MORE = [
  { href: "/budgeting", label: "Budgeting" },
  { href: "/emergency-fund", label: "Emergency Fund" },
  { href: "/savings", label: "Savings" },
  { href: "/money-management", label: "Money Management" },
];

/**
 * Dedicated Saving Money hub — same proven pattern as DebtHub/CreditHub:
 * keyTakeaways/sections primer from topic-config.ts, single CMS-first article
 * feed, a real "Explore Saving Money Guides" index of the category's own
 * specialist articles, aggregated FAQ. Replaces the generic CategoryFeed this
 * route used previously. Deliberately distinct from /savings (accounts, CDs,
 * APY) — this pillar covers the behavioral/expense-cutting side of saving.
 */
export async function SavingMoneyHub() {
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

  const shownSlugs = new Set<string>([
    ...(featured ? [featured.slug] : []),
    ...sidebarArticles.map((a) => a.slug),
    ...trending.map((a) => a.slug),
  ]);
  const gridArticles = rest.filter((a) => !shownSlugs.has(a.slug));

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
        {Math.max(articles.length, 10)}+ Saving Money Guides &middot; Reviewed &amp; Updated Regularly
      </p>

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
                <HorizontalArticleCard key={article.id} article={article} categoryLabel={copy.title} />
              ))}
            </aside>
            <div className="lg:col-span-2">
              <FeaturedArticleCard article={featured} categoryLabel={copy.title} />
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
                  <p className="text-xs font-semibold text-primary mb-1">{copy.title}</p>
                  <h3 className="text-sm font-bold text-foreground leading-snug group-hover:underline line-clamp-3">
                    {article.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {gridArticles.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              <BookOpen className="h-4 w-4" />
              Explore Saving Money Guides
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridArticles.map((article) => (
                <ArticleCard key={article.id} article={article} categoryLabel={copy.title} />
              ))}
            </div>
          </section>
        )}

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
          <h3 className="text-lg font-bold text-foreground">Save More Every Month</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Get practical money-saving tips delivered weekly — no guaranteed outcomes, just clear explanations.
          </p>
          <NewsletterForm />
        </section>

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
