import { OptimizedImage } from "@/components/common/OptimizedImage";
import type { WorldData } from "@/lib/data/worldRegions";
import { StoryLink } from "@/components/common/StoryLink";

/** CNBC's "PRO News and Analysis" module, rebranded — reuses real section
 * items already fetched for the page (no new data source). No fake "PRO"
 * paywall badge: Imperialpedia doesn't have that subscription product, so
 * this uses a plain "ANALYSIS" kicker instead of fabricating a paid tier. */
export default function FeaturedAnalysis({ sections }: { sections: WorldData["sections"] }) {
  const items = sections.flatMap((s) => s.items).slice(0, 6);
  if (items.length === 0) return null;

  return (
    <div className="border-b border-border px-2 sm:px-4 py-5">
      <h2 className="world-kicker text-xl font-black tracking-widest text-foreground uppercase border-b-4 border-[hsl(var(--cnbc-gold))] inline-block pb-1 mb-4">
        Analysis
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        {items.map((item) => (
          <StoryLink key={item.id} item={item} className="flex gap-3">
            {item.image && (
              <div className="relative w-24 h-16 shrink-0 rounded-sm overflow-hidden">
                <OptimizedImage
                  src={item.image}
                  alt={item.headline}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            )}
            <div className="min-w-0">
              <span className="world-kicker inline-block bg-[hsl(var(--cnbc-surface))] text-white text-[8px] font-black px-1.5 py-0.5 mb-1 tracking-wide">
                ANALYSIS
              </span>
              <p className="text-xs font-semibold leading-snug text-foreground hover:text-[hsl(var(--cnbc-red))] hover:underline line-clamp-3">
                {item.headline}
              </p>
              <span className="text-[10px] text-muted-foreground mt-1 block">{item.time}</span>
            </div>
          </StoryLink>
        ))}
      </div>
    </div>
  );
}
