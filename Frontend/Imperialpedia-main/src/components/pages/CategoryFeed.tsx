import { newsArticles, type NewsArticle } from "@/lib/data.news";
import { getCategoryArticles } from "@/services/data/cms-public";
import { staticCategoryNews } from "@/services/data/static-content";
import { topicCopy, staticCategoryFor } from "@/lib/topic-config";
import { ExploreNewsSection } from "@/app/news/ExploreNewsSection";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";
import { env } from "@/config/env";

type Props = {
  /** CMS category slug + topic-config key (e.g. "banking"). */
  slug: string;
};

/**
 * Shared, CMS-driven topic page. Pulls published articles for the given category
 * from cms-service; if the CMS has none yet, falls back to the bundled static set
 * (filtered to the closest NewsCategory) so the page is never empty during the
 * static→dynamic transition. Layout mirrors the original topic-page template.
 */
export async function CategoryFeed({ slug }: Props) {
  const copy = topicCopy(slug);

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

  // 2) Fallback to bundled demo content (category-filtered, then whole set) so the
  //    page stays populated for topics that have no published content yet.
  if (!isLive) {
    const cat = staticCategoryFor(slug);
    const filtered = cat ? newsArticles.filter((a) => a.category === cat) : [];
    articles = filtered.length ? filtered : newsArticles;
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

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-12">
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

        {gridArticles.length > 0 && (
          <section className="pb-4 md:pb-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
              Explore {isLive ? copy.title : "News"}
            </h2>
            <ExploreNewsSection articles={gridArticles} />
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

export default CategoryFeed;
