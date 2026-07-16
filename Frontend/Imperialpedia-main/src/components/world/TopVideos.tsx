import { OptimizedImage } from "@/components/common/OptimizedImage";
import { categoryImage } from "@/lib/data/categoryImage";
import type { WorldData } from "@/lib/data/worldRegions";

/** Placeholder video-teaser grid — self-hosted category photography with a
 * play-icon overlay. Deliberately NOT real embedded video (no video pipeline
 * exists, and CNBC's actual show recordings can't be used). Real headlines
 * from the live feed, presented explicitly as a preview — no player, no
 * fabricated paid subscription product. */
export default function TopVideos({ latest }: { latest: WorldData["latest"] }) {
  const items = latest.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="world-kicker text-sm font-black tracking-widest text-gray-900 uppercase border-l-4 border-[#ce2b2b] pl-2">
          Imperialpedia Video
        </span>
      </div>
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
                <span className="w-9 h-9 rounded-full bg-[#ce2b2b]/90 flex items-center justify-center">
                  <span className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white ml-0.5" />
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
