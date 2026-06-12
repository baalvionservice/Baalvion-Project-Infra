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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-screen-xl mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <span className="hidden sm:flex items-center text-[10px] font-black tracking-widest text-gray-400 uppercase pr-3 shrink-0">
            Region
          </span>
          {regions.map((r) => {
            const active = r.id === current;
            return (
              <Link
                key={r.id}
                href={regionPath(r.id)}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap text-[11px] sm:text-xs font-bold tracking-wide uppercase px-3 py-3 border-b-[3px] transition-all ${
                  active
                    ? "border-[#CC0000] text-[#CC0000]"
                    : "border-transparent text-gray-600 hover:text-[#CC0000] hover:border-gray-300"
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
