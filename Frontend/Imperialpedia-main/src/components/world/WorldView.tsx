import HeroFeatured from "@/components/world/HeroFeatured";
import LatestNews from "@/components/world/LatestNews";
import MarketIndicatorBar from "@/components/world/MarketIndicatorBar";
import MarketsPanel from "@/components/world/MarketsPanel";
import MarketTicker from "@/components/world/MarketTicker";
import NewsGrid from "@/components/world/NewsGrid";
import RegionSelector from "@/components/world/RegionSelector";
import { regionPath, type WorldData } from "@/lib/data/worldRegions";
import { env } from "@/config/env";

/** Schema.org structured data so search engines show rich results for the feed. */
function buildJsonLd(data: WorldData) {
  const base = env.siteUrl.replace(/\/$/, "");
  const url = `${base}${regionPath(data.region.id)}`;
  const headlines = [...data.featured, ...data.latest]
    .slice(0, 15)
    .map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.headline }));

  const breadcrumb = [
    { "@type": "ListItem", position: 1, name: "Home", item: base },
    { "@type": "ListItem", position: 2, name: "World", item: `${base}/world` },
  ];
  if (data.region.id !== "world") {
    breadcrumb.push({ "@type": "ListItem", position: 3, name: data.region.label, item: url });
  }

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${data.region.label} Markets & Business News`,
      description: `Live ${data.region.label} markets, indices and the latest business, economy and financial news from Imperialpedia.`,
      url,
      isPartOf: { "@type": "WebSite", name: "Imperialpedia", url: base },
      about: [
        { "@type": "Thing", name: "Financial markets" },
        { "@type": "Thing", name: `${data.region.label} economy` },
      ],
      mainEntity: { "@type": "ItemList", itemListElement: headlines },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumb,
    },
  ];
}

/**
 * Shared CNBC-style World layout, rendered by both the canonical `/world`
 * page and the clean per-region routes `/world/[region]`.
 */
export default function WorldView({ data }: { data: WorldData }) {
  return (
    <div className="min-h-screen bg-gray-100 mt-12 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(data)) }}
      />
      {/* Scrolling market ticker (region-scoped) */}
      <MarketTicker indicators={data.indicators} />

      {/* CNBC-style region selector → clean /world/<region> paths */}
      <RegionSelector current={data.region.id} />

      {/* Dark market indicators strip */}
      <div className="max-w-screen-xl mx-auto">
        <MarketIndicatorBar
          indicators={data.indicators}
          asOf={data.asOf}
          regionLabel={data.region.label}
        />

        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-screen-xl mx-auto flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
              You are here:
            </span>
            <span className="text-[10px] font-black tracking-widest text-gray-700 uppercase">
              World
            </span>
            <span className="text-gray-300">›</span>
            <span className="text-[10px] font-black tracking-widest text-[#CC0000] uppercase">
              {data.region.label}
            </span>
          </div>
        </div>
      </div>

      {/* Main layout — responsive:
          • mobile  (<768): single column, stacked
          • iPad    (md):   markets panel + news side-by-side
          • desktop (lg+):  3 zones — markets | news | Latest News rail */}
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] gap-px bg-gray-200">
          {/* CENTER — Main content area */}
          <main className="bg-white order-1 min-w-0">
            <HeroFeatured featured={data.featured} />

            <div className="px-2 sm:px-4">
              <div className="flex flex-col md:grid md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] gap-4">
                <aside className="bg-white md:border-l border-gray-200 order-2 md:order-1 min-w-0">
                  <MarketsPanel markets={data.markets} watchlist={data.watchlist} />
                </aside>
                <div className="order-1 md:order-2 min-w-0">
                  <NewsGrid sections={data.sections} />
                </div>
              </div>
            </div>
          </main>

          {/* Latest News — desktop right rail (lg+) */}
          <aside className="bg-white lg:border-l border-gray-200 order-2 hidden lg:block">
            <LatestNews latest={data.latest} />
          </aside>
        </div>

        {/* Latest News — mobile + iPad (below the fold, full width) */}
        <div className="lg:hidden bg-white border-t-2 border-gray-200">
          <LatestNews latest={data.latest} />
        </div>
      </div>
    </div>
  );
}
