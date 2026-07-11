import type { WorldData } from "@/lib/data/worldRegions";

/** CNBC-style "Trending Now" rail — top of the live "latest" feed, numbered. */
export default function TrendingNow({ latest }: { latest: WorldData["latest"] }) {
  const items = latest.slice(0, 5);
  if (items.length === 0) return null;

  return (
    <div className="bg-white border-t-2 border-gray-200">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <span className="world-kicker text-[10px] font-black tracking-widest text-gray-900 uppercase">
          Trending Now
        </span>
      </div>
      <ol className="divide-y divide-gray-50">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="group flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="world-kicker text-lg font-black text-gray-200 leading-none w-5 shrink-0">
              {i + 1}
            </span>
            <span className="text-xs font-semibold leading-snug text-gray-800 group-hover:text-[#ce2b2b] transition-colors line-clamp-2">
              {item.headline}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
