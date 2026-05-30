import { newsArticles } from "@/lib/data.news";
import { getPublishedNews } from "@/services/data/cms-public";
import { buildMetadata } from "@/lib/seo";
import { ExploreNewsSection } from "../news/ExploreNewsSection";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";

export const metadata = buildMetadata({
  title: "Financial Product Reviews and Comparisons",
  description:
    "Stay informed with the latest financial product reviews, service comparisons, and expert analysis. Our reviews section covers brokers, banks, credit cards, and financial services.",
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ReviewsPage() {
  const liveNews = await getPublishedNews();
  const list = liveNews.length > 0 ? liveNews : newsArticles;
  const featured = list.find((a) => a.featured) ?? list[0];
  const rest = list.filter((a) => a.slug !== featured?.slug);
  const sidebarArticles = rest.slice(0, 3);
  const gridArticles = rest.slice(3);

  if (!featured) {
    return (
      <div className="min-h-screen pt-20 text-center px-4">
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="mt-3 text-muted-foreground">No content published yet.</p>
      </div>
    );
  }

  return (
    <div className=" min-h-screen">
      {/* ── Hero header ── */}
      <HeadingSection
        tag="REVIEWS"
        title={"Financial Product Reviews"}
        description="Read comprehensive reviews and comparisons of financial products, services, and platforms to make informed decisions about your money."
      />

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-12">
        {/* ── Top section: featured + sidebar ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar latest */}
          <aside className="flex flex-col">
            {sidebarArticles.map((article) => (
              <HorizontalArticleCard key={article.id} article={article} />
            ))}
          </aside>
          {/* Featured (takes 2/3 width) */}
          <div className="lg:col-span-2">
            <FeaturedArticleCard article={featured} />
          </div>
        </section>

        {/* ── Article grid ── */}
        <section className="pb-4 md:pb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
            Explore News
          </h2>

          <ExploreNewsSection articles={gridArticles} />
        </section>
      </div>
    </div>
  );
}
