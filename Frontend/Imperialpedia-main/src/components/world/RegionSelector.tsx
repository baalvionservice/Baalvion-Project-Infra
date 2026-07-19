import Link from "next/link";
import { REGIONS, regionPath, type RegionId } from "@/lib/data/worldRegions";

/**
 * CNBC-style region tab bar that drives the `?region=` query param
 * (e.g. /world/?region=europe). Server component — pure links, the active
 * region is highlighted with the signature red underline.
 */
export default function RegionSelector({
  current,
  enabled,
}: {
  current: RegionId;
  enabled?: RegionId[];
}) {
  // Show only admin-enabled regions (always keep the active one visible).
  const regions = enabled
    ? REGIONS.filter((r) => enabled.includes(r.id) || r.id === current)
    : REGIONS;
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-screen-xl mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <span className="world-kicker hidden sm:flex items-center text-[10px] font-black tracking-widest text-muted-foreground uppercase pr-3 shrink-0">
            Region
          </span>
          {regions.map((r) => {
            const active = r.id === current;
            return (
              <Link
                key={r.id}
                href={regionPath(r.id)}
                aria-current={active ? "page" : undefined}
                className={`world-kicker whitespace-nowrap text-[11px] sm:text-xs font-bold tracking-wide uppercase px-3 py-3 border-b-[3px] transition-all ${
                  active
                    ? "border-[hsl(var(--cnbc-red))] text-[hsl(var(--cnbc-red))]"
                    : "border-transparent text-muted-foreground hover:text-[hsl(var(--cnbc-red))] hover:border-border"
                }`}
              >
                <span className="sm:hidden">{r.short}</span>
                <span className="hidden sm:inline">{r.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
