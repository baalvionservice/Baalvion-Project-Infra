import FAQ from "@/components/faq/FAQ";
import { StockPageData, stocksPageData } from "@/lib/data/data.stocks";
import { buildMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import HeadingSection from "@/components/layout/HeadingSection";
import { stockFaqs } from "@/lib/data/data.faq";
import { ExploreStocksSection } from "./components/ExploreStocksSection";

export const metadata = buildMetadata({
  title: "Stocks News and Analysis | Imperial Finance",
  description:
    "Stay informed with the latest financial news, market insights, and expert analysis. Our news section covers global markets, economic trends, and investment strategies to help you make informed decisions.",
});

function HorizontalArticleCard({
  article,
}: {
  article: StockPageData["latest"][0];
}) {
  return (
    <Link
      href={`/${article.slug}`}
      className="group flex gap-3 items-center py-4 border-b border-border last:border-none"
    >
      <div className="relative flex-shrink-0 w-32 h-full overflow-hidden">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-primary tracking-wider">STOCKS</p>
        <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:underline line-clamp-2">
          {article.title}
        </h3>
        <div className="text-muted-foreground text-sm">
          By <span className="">{article.author.name}</span>
        </div>
      </div>
    </Link>
  );
}

/** Large hero card — the featured article */
function FeaturedArticleCard({
  article,
}: {
  article: StockPageData["featured"];
}) {
  return (
    <Link href={`/${article.slug}`} className="group block">
      <div className="relative w-full md:mt-6 overflow-hidden aspect-[16/9] lg:aspect-[21/9]">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 75vw"
          priority
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>
      {/* text */}
      <div className="py-5 space-y-3">
        <p className="text-primary tracking-wider">STOCKS</p>
        <h2 className="text-foreground text-2xl md:text-3xl font-bold leading-snug max-w-2xl group-hover:underline group-hover:text-primary underline-offset-4">
          {article.title}
        </h2>

        <p className="text-muted-foreground text-xs">
          By {article.author.name}
        </p>
      </div>
    </Link>
  );
}

export default function StockPage() {
  const featured = stocksPageData.featured;
  const gridArticles = stocksPageData.latest.filter((a) => !a.featured);

  return (
    <div className="min-h-screen">
      {/* ── Hero header ── */}
      <HeadingSection
        tag={"INVESTING"}
        title={"Stocks"}
        description={
          "Stocks represent ownership of a company. Stocks owned either directly or through a mutual fund or ETF, will likely form the majority of most investors’ portfolios."
        }
      />

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-12">
        {/* ── Top section: featured + sidebar ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured (takes 2/3 width) */}
          <div className="lg:col-span-2">
            <FeaturedArticleCard article={featured} />
          </div>

          {/* Sidebar latest */}
          <aside className="flex flex-col">
            {stocksPageData.latest.map((article) => (
              <HorizontalArticleCard key={article.id} article={article} />
            ))}
          </aside>
        </section>

        {/* ── FAQ ── */}
        <section className="w-full pb-4 md:pb-12">
          <FAQ data={stockFaqs} />
        </section>

        {/* ── Article grid ── */}
        <section className="pb-4 md:pb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 pb-2">
            Explore Stocks
          </h2>

          <ExploreStocksSection articles={gridArticles} />
        </section>
      </div>
    </div>
  );
}
