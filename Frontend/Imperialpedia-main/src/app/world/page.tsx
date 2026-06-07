import type { Metadata } from "next";
import HeroFeatured from "@/components/world/HeroFeatured";
import LatestNews from "@/components/world/LatestNews";
import MarketIndicatorBar from "@/components/world/MarketIndicatorBar";
import MarketsPanel from "@/components/world/MarketsPanel";
import MarketTicker from "@/components/world/MarketTicker";
import NewsGrid from "@/components/world/NewsGrid";
import RegionSelector from "@/components/world/RegionSelector";
import { resolveRegion } from "@/lib/data/worldRegions";
import { getWorldDataLive } from "@/lib/data/worldFeed";

type SearchParams = Promise<{ region?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { region } = await searchParams;
  const r = resolveRegion(region);
  return {
    title: `${r.label} Markets & Business News | Imperialpedia World`,
    description: `Live ${r.label} markets, indices and the latest business, economy and financial news from Imperialpedia.`,
    alternates: { canonical: `/world/?region=${r.id}` },
  };
}

export default async function WorldPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { region } = await searchParams;
  const data = await getWorldDataLive(region);

  return (
    <div className="min-h-screen bg-gray-100 mt-12 font-sans">
      {/* Scrolling market ticker (region-scoped) */}
      <MarketTicker indicators={data.indicators} />

      {/* CNBC-style region selector → drives ?region= */}
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

      {/* Main layout: Main Content | Latest News */}
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_260px] gap-px bg-gray-200">
          {/* CENTER — Main content area */}
          <main className="bg-white order-1">
            {/* Hero featured stories */}
            <HeroFeatured featured={data.featured} />

            {/* Main body padding */}
            <div className="px-2 sm:px-4">
              {/* Markets panel | Sectioned news grid */}
              <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr] gap-4">
                <aside className="bg-white lg:border-l border-gray-200 order-2 lg:order-1">
                  <MarketsPanel markets={data.markets} watchlist={data.watchlist} />
                </aside>
                <div className="order-1 lg:order-2">
                  <NewsGrid sections={data.sections} />
                </div>
              </div>
            </div>
          </main>

          {/* Latest News — desktop right rail */}
          <aside className="bg-white lg:border-r border-gray-200 order-3 lg:order-2 hidden lg:block">
            <LatestNews latest={data.latest} />
          </aside>
        </div>
      </div>
    </div>
  );
}
