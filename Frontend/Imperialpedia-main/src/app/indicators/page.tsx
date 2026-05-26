import { newsArticles } from "@/lib/data.news";
import { buildMetadata } from "@/lib/seo";
import { ExploreNewsSection } from "../news/ExploreNewsSection";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";

export const metadata = buildMetadata({
  title: "Economic Indicators and Market Data",
  description:
    "Stay informed with the latest economic indicators, market data, and economic metrics. Our indicators section covers GDP, inflation, employment, and key economic measurements.",
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function IndicatorsPage() {
  const featured = newsArticles.find((a) => a.featured)!;
  const sidebarArticles = newsArticles.filter((a) => !a.featured).slice(0, 3);
  const gridArticles = newsArticles.filter((a) => !a.featured).slice(3);

  return (
    <div className=" min-h-screen">
      {/* ── Hero header ── */}
      <HeadingSection
        tag="ECONOMY"
        title={"Economic Indicators"}
        description="Track key economic indicators, market data, and economic metrics that drive financial markets and investment decisions."
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
