import { newsArticles } from "@/lib/data.news";
import { buildMetadata } from "@/lib/seo";
import { ExploreNewsSection } from "../news/ExploreNewsSection";
import { FeaturedArticleCard } from "@/components/pages/FeaturedArticleCard";
import { HorizontalArticleCard } from "@/components/pages/HorizontalArticleCard";
import HeadingSection from "@/components/layout/HeadingSection";

export const metadata = buildMetadata({
  title: "Budgeting and Money Management",
  description:
    "Stay informed with the latest budgeting strategies, money management tips, and financial planning techniques. Our budgeting section covers expense tracking, saving strategies, and financial goals.",
  canonical: '/budgeting',
  noIndex: false,
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BudgetingPage() {
  const featured = newsArticles.find((a) => a.featured)!;
  const sidebarArticles = newsArticles.filter((a) => !a.featured).slice(0, 3);
  const gridArticles = newsArticles.filter((a) => !a.featured).slice(3);

  return (
    <div className=" min-h-screen">
      {/* ── Hero header ── */}
      <HeadingSection
        tag="PERSONAL FINANCE"
        title={"Budgeting & Money Management"}
        description="Master budgeting techniques, expense tracking, and money management strategies to achieve your financial goals and build wealth."
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
