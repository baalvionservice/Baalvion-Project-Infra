"use client";
import { useRef } from "react";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import type { FeaturedStory } from "@/lib/data/worldRegions";
import { StoryLink } from "@/components/common/StoryLink";

/** CNBC-style horizontal "Special Reports" carousel — reuses the same real,
 * live featured stories already fetched for the hero (no new data source). */
export default function SpecialReports({ featured }: { featured: FeaturedStory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (featured.length === 0) return null;

  function scrollBy(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <div className="bg-card border-b border-border px-2 sm:px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="world-kicker text-sm font-black tracking-widest text-foreground uppercase border-l-4 border-[hsl(var(--cnbc-gold))] pl-2">
          Special Reports
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="w-7 h-7 flex items-center justify-center border border-border rounded-sm hover:bg-muted"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="w-7 h-7 flex items-center justify-center border border-border rounded-sm hover:bg-muted"
          >
            ›
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth">
        {featured.map((story) => (
          <StoryLink
            key={story.id}
            item={story}
            className="relative shrink-0 w-64 h-36 rounded-sm overflow-hidden group block"
          >
            <OptimizedImage
              src={story.image}
              alt={story.headline}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="256px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-3">
              <p className="text-white text-xs font-bold leading-snug line-clamp-3">{story.headline}</p>
              <p className="world-kicker text-[hsl(var(--cnbc-gold))] text-[10px] mt-1">{story.author}</p>
            </div>
          </StoryLink>
        ))}
      </div>
    </div>
  );
}
