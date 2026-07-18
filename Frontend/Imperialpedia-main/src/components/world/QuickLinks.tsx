import type { WorldData } from "@/lib/data/worldRegions";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Shared with NewsGrid so pill links land exactly on the section header. */
export function sectionAnchorId(title: string): string {
  return `section-${slugify(title)}`;
}

/** CNBC-style "Quick Links" pill row — real section titles from the live
 * feed, each an in-page anchor (no fabricated topics). */
export default function QuickLinks({ sections }: { sections: WorldData["sections"] }) {
  if (sections.length === 0) return null;

  return (
    <div className="bg-card border-b border-border px-2 sm:px-4 py-2.5 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="world-kicker text-[10px] font-black tracking-widest text-muted-foreground uppercase shrink-0">
          Quick Links
        </span>
        {sections.map((s) => (
          <a
            key={s.section}
            href={`#${sectionAnchorId(s.section)}`}
            className="text-[11px] font-semibold text-[hsl(var(--cnbc-red))] bg-muted hover:bg-card/10 px-2.5 py-1 rounded-sm transition-colors shrink-0"
          >
            {s.section}
          </a>
        ))}
      </div>
    </div>
  );
}
