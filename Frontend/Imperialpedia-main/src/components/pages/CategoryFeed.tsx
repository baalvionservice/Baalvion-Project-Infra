import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles } from "@/services/data/cms-public";
import { staticCategoryNews } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor, parentFor, siblingsFor } from "@/lib/topic-config";
import { getSiteContent } from "@/lib/data/site-content";
import { ExploreNewsSection } from "@/app/news/ExploreNewsSection";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import { SubtopicTabs } from "@/components/pages/SubtopicTabs";
import HeadingSection from "@/components/layout/HeadingSection";
import { env } from "@/config/env";
import { newsArticleHref } from "@/lib/data/article-url";
import Link from "next/link";

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
  if (!isLive) {
    const cat = staticCategoryFor(slug);
    articles = cat ? newsArticles.filter((a) => a.category === cat) : [];
  }

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);
  const sidebarArticles = rest.slice(0, 3);
  const gridArticles = rest.slice(3);

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
      <HeadingSection tag={copy.tag} eyebrow={parentFor(slug)} title={copy.title} description={copy.description} />

      {(copy.keyTakeaways?.length || copy.sections?.length || introParagraphs.length > 0 || copy.faqs?.length || copy.relatedReading?.length) ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl pb-8">
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

            {copy.sections && copy.sections.length > 0 ? (
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
            ) : (
              introParagraphs.length > 0 && (
                <div className="space-y-4">
                  {introParagraphs.map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )
            )}

            {copy.faqs && copy.faqs.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-bold text-foreground mb-4">Frequently Asked Questions</h2>
                <div className="space-y-5">
                  {copy.faqs.map((faq, i) => (
                    <div key={i}>
                      <h3 className="text-sm font-bold text-foreground mb-1">{faq.question}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
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

      {siblings && (
        <div className="max-w-7xl mx-auto px-4">
          <SubtopicTabs current={slug} siblings={siblings} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-12">
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

        {gridArticles.length > 0 && (
          <section className="pb-4 md:pb-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Explore {isLive ? copy.title : "News"}
            </h2>
            <ExploreNewsSection articles={gridArticles} categoryLabel={copy.title} />
          </section>
        )}

        {!featured && (
          <p className="py-16 text-center text-muted-foreground">
            No articles published in this category yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
