import { OptimizedImage } from "@/components/common/OptimizedImage";
import type { WorldData } from "@/lib/data/worldRegions";

/** CNBC's "PRO News and Analysis" module, rebranded — reuses real section
 * items already fetched for the page (no new data source). No fake "PRO"
 * paywall badge: Imperialpedia doesn't have that subscription product, so
 * this uses a plain "ANALYSIS" kicker instead of fabricating a paid tier. */
export default function FeaturedAnalysis({ sections }: { sections: WorldData["sections"] }) {
  const items = sections.flatMap((s) => s.items).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div className="border-b border-gray-200 px-2 sm:px-4 py-5">
      <h2 className="world-kicker text-xl font-black tracking-widest text-gray-900 uppercase border-b-4 border-[#fcb700] inline-block pb-1 mb-4">
        Analysis
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative w-24 h-16 shrink-0 rounded-sm overflow-hidden">
              <OptimizedImage
                src={item.image}
                alt={item.headline}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <div className="min-w-0">
              <span className="world-kicker inline-block bg-[#002f6c] text-white text-[8px] font-black px-1.5 py-0.5 mb-1 tracking-wide">
                ANALYSIS
              </span>
              <p className="text-xs font-semibold leading-snug text-[#005594] hover:text-[#ce2b2b] hover:underline cursor-pointer line-clamp-3">
                {item.headline}
              </p>
              <span className="text-[10px] text-gray-400 mt-1 block">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
