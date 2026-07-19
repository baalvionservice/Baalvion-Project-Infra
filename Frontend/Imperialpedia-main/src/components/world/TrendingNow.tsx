import type { WorldData } from "@/lib/data/worldRegions";

/** CNBC-style "Trending Now" rail — top of the live "latest" feed, numbered. */
export default function TrendingNow({ latest }: { latest: WorldData["latest"] }) {
  const items = latest.slice(0, 5);
  if (items.length === 0) return null;

  return (
    <div className="bg-card border-t-2 border-border">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <span className="world-kicker text-[10px] font-black tracking-widest text-foreground uppercase">
          Trending Now
        </span>
      </div>
      <ol className="divide-y divide-border">
        {items.map((item, i) => (
          <li
            key={item.id}
            className="group flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <span className="world-kicker text-lg font-black text-white/20 leading-none w-5 shrink-0">
              {i + 1}
            </span>
            <span className="text-xs font-semibold leading-snug text-foreground group-hover:text-[hsl(var(--cnbc-red))] transition-colors line-clamp-2">
              {item.headline}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
