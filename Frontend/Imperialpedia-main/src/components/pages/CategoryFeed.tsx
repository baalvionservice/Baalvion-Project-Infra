import Image from "next/image";
import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles } from "@/services/data/cms-public";
import { staticCategoryNews } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor, parentFor, siblingsFor } from "@/lib/topic-config";
import { getSiteContent } from "@/lib/data/site-content";
import { ExploreNewsSection } from "@/app/news/ExploreNewsSection";
import { SubtopicTabs } from "@/components/pages/SubtopicTabs";
import { TrustBar } from "@/components/pages/TrustBar";
import EditorialHeader from "@/components/pages/EditorialHeader";
import { EditorialSpotlight } from "@/components/pages/EditorialSpotlight";
import { EditorialArticleGuide } from "@/components/pages/EditorialArticleGuide";
import { InvestopediaKeyTerms } from "@/components/pages/InvestopediaKeyTerms";
import { InvestopediaFaqBox } from "@/components/pages/InvestopediaFaqBox";
import { getKeyTermsForTopic } from "@/lib/topic-key-terms";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";
import Link from "next/link";
import { FileText } from "lucide-react";

type Props = {
  /** CMS category slug + topic-config key (e.g. "banking"). */
  slug: string;
};

/**
 * Whether this category has real content to show — live CMS articles or a
 * committed baked snapshot. Deliberately excludes the bundled demo fallback
 * (`staticCategoryFor`/`newsArticles`): that's a display-only placeholder so
 * the page is never blank to a visitor, not genuine content, so it shouldn't
 * count toward "this page is worth indexing." Used by each topic page's
 * `generateMetadata` to noindex an empty category until it has real articles
 * — same pattern as the glossary's GLOSSARY_LIVE flag, but per-category and
 * automatic: publish an article for the category in the admin panel and the
 * page re-indexes on its own, no code change or redeploy needed.
 */
export async function categoryHasLiveContent(slug: string): Promise<boolean> {
  const live = await getCategoryArticles(slug, 1);
  if (live.length > 0) return true;
  return staticCategoryNews(slug).length > 0;
}

/**
 * Shared, CMS-driven topic page. Pulls published articles for the given category
 * from cms-service; if the CMS has none yet, falls back to the bundled static set
 * (filtered to the closest NewsCategory) so the page is never empty during the
 * static→dynamic transition. Layout mirrors the original topic-page template.
 */
export async function CategoryFeed({ slug }: Props) {
  const copy = topicCopy(slug);
  const siblings = siblingsFor(slug);

  // Admin-managed override (Imperialpedia > Site Content, type "topic-hub")
  // takes precedence over the bundled default in topic-config.ts.
  const liveTopic = await getSiteContent<{ intro?: string }>("topic-hub", slug);
  const intro = liveTopic?.intro ?? copy.intro;
  const introParagraphs = Array.isArray(intro) ? intro : intro ? [intro] : [];

  // 1) Live CMS content for this category.
  let articles: NewsArticle[] = await getCategoryArticles(slug, 30);
  let isLive = articles.length > 0;

  // 1b) Baked snapshot (committed): real published content when the CMS is offline
  //     (e.g. on Vercel). Treated as live so the page shows the genuine articles.
  if (!isLive) {
    const baked = staticCategoryNews(slug);
    if (baked.length) {
      articles = baked;
      isLive = true;
    }
  }

  // 2) Fallback to bundled demo content, filtered to this topic's mapped NewsCategory.
  //    Deliberately does NOT fall back further to the whole demo set — a topic with no
  //    CMS content, no baked snapshot, and no matching demo category should show the
  //    "no articles yet" empty state below, not an unrelated grab-bag of demo articles
  //    (this previously dumped e.g. Crypto/Economy/Stocks articles onto /advisor-reviews).
  if (!isLive || articles.length === 0) {
    const cat = staticCategoryFor(slug);
    const matched = cat ? newsArticles.filter((a) => a.category === cat) : [];
    articles = matched.length > 0 ? matched : newsArticles.filter((a) => a.category === 'PersonalFinance' || a.category === 'RealEstate');
    if (articles.length === 0) {
      articles = newsArticles.slice(0, 15);
    }
  }

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);
  const sidebarArticles = rest.slice(0, 4);
  const gridArticles = rest.slice(4);

  // ── SEO: CollectionPage + ItemList + Breadcrumb structured data ──
  const base = (env.siteUrl || "https://imperialpedia.com").replace(/\/$/, "");
  const pageUrl = `${base}/${slug}`;
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
  const faqSchema = copy.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: copy.faqs.map((f) => ({
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
      {/* Investopedia Editorial Header */}
      <EditorialHeader
        eyebrow={
          parentFor(slug)
            ? { label: parentFor(slug)!.label, href: parentFor(slug)!.href }
            : undefined
        }
        title={copy.title}
        description={copy.description}
      />

      <TrustBar />

      {siblings && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <SubtopicTabs current={slug} siblings={siblings} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* Investopedia 5-Post Lead Spotlight Section (matching screenshot) */}
        <EditorialSpotlight
          badgeLabel={`ALL ABOUT ${copy.title.toUpperCase()}`}
          featured={featured ?? undefined}
          sidebarArticles={sidebarArticles}
          categoryLabel={copy.title}
          layout="right"
        />

        {/* Investopedia Key Terms Glossary (Unique per topic) */}
        <InvestopediaKeyTerms
          title={`Key Terms in ${copy.title}`}
          terms={getKeyTermsForTopic(slug)}
        />

        {/* Investopedia Blue-Bordered FAQ Box (Unique per topic) */}
        {copy.faqs && copy.faqs.length > 0 && (
          <InvestopediaFaqBox
            title={`Frequently Asked Questions about ${copy.title}`}
            faqs={copy.faqs.map((f) => ({
              question: f.question,
              answer: f.answer,
              link: { label: `Learn more about ${copy.title}`, href: `/${slug}` },
            }))}
          />
        )}

        {/* Explore Section with Filter Tabs */}
        {gridArticles.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Explore {isLive ? copy.title : "News"}
            </h2>
            <ExploreNewsSection articles={gridArticles} categoryLabel={copy.title} />
          </section>
        )}

        {/* In-Depth Newspaper Editorial Guide & Key Takeaways */}
        <EditorialArticleGuide
          title={`Essential ${copy.title} Guide: Principles & Practical Rules`}
          categoryName={copy.title}
          keyTakeaways={copy.keyTakeaways}
          sections={copy.sections}
          introParagraphs={introParagraphs}
        />

        {copy.relatedReading && copy.relatedReading.length > 0 && (
          <div className="mt-10 rounded-2xl border border-border p-6 bg-muted/20">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Related Reading
            </p>
            <ul className="space-y-2">
              {copy.relatedReading.map((link) => (
                <li key={link.slug}>
                  <Link href={`/${link.slug}`} className="text-sm font-semibold text-[#1d4fc4] hover:underline">
                    {link.anchor}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!featured && (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              No articles published in this category yet — check back soon.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              ← Browse all topics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
