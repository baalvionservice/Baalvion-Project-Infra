import { OptimizedImage } from "@/components/common/OptimizedImage";
import { categoryImage } from "@/lib/data/categoryImage";
import type { WorldData } from "@/lib/data/worldRegions";

/** CNBC's "CNBC Explains" module, rebranded — placeholder explainer-teaser
 * grid using self-hosted category photography with a play-icon overlay
 * (same pattern as TopVideos). Real headlines from the live feed; no real
 * video or illustrated artwork is used or claimed. */
export default function ImperialpediaExplains({ latest }: { latest: WorldData["latest"] }) {
  const items = latest.slice(6, 12);
  if (items.length === 0) return null;

  return (
    <div className="border-b border-gray-200 px-2 sm:px-4 py-4">
      <h2 className="world-kicker text-xl font-black tracking-widest text-gray-900 uppercase border-b-4 border-[#fcb700] inline-block pb-1 mb-4">
        Imperialpedia Explains
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {items.map((item) => (
          <div key={item.id} className="group">
            <div className="relative aspect-video rounded-sm overflow-hidden bg-gray-100">
              <OptimizedImage
                src={categoryImage(item.category)}
                alt={item.headline}
                fill
                className="object-cover opacity-90"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="w-9 h-9 rounded-full bg-[#fcb700]/95 flex items-center justify-center">
                  <span className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-[#002f6c] ml-0.5" />
                </span>
              </div>
            </div>
            <p className="text-xs font-semibold leading-snug text-gray-800 mt-1.5 line-clamp-2">
              {item.headline}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
