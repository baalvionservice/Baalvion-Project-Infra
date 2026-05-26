import { newsArticles } from "@/lib/data.news";
import { buildMetadata } from "@/lib/seo";
import { ExploreNewsSection } from "../news/ExploreNewsSection";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";

export const metadata = buildMetadata({
  title: "Bonds and Fixed Income Investing",
  description:
    "Stay informed with the latest bond market news, fixed income strategies, and interest rate analysis. Our bonds section covers government bonds, corporate bonds, and fixed income investments.",
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BondsPage() {
  const featured = newsArticles.find((a) => a.featured)!;
  const sidebarArticles = newsArticles.filter((a) => !a.featured).slice(0, 3);
  const gridArticles = newsArticles.filter((a) => !a.featured).slice(3);

  return (
    <div className=" min-h-screen">
      {/* ── Hero header ── */}
      <HeadingSection
        tag="INVESTING"
        title={"Bonds & Fixed Income"}
        description="Explore bond markets, fixed income strategies, and interest rate trends to build a stable investment portfolio."
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
