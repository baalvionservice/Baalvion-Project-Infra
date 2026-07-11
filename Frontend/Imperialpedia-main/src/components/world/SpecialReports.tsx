"use client";
import { useRef } from "react";
import { OptimizedImage } from "@/components/common/OptimizedImage";
import type { FeaturedStory } from "@/lib/data/worldRegions";

/** CNBC-style horizontal "Special Reports" carousel — reuses the same real,
 * live featured stories already fetched for the hero (no new data source). */
export default function SpecialReports({ featured }: { featured: FeaturedStory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  if (featured.length === 0) return null;

  function scrollBy(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="world-kicker text-sm font-black tracking-widest text-gray-900 uppercase border-l-4 border-[#002f6c] pl-2">
          Special Reports
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-sm hover:bg-gray-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-sm hover:bg-gray-50"
          >
            ›
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth">
        {featured.map((story) => (
          <div
            key={story.id}
            className="relative shrink-0 w-64 h-36 rounded-sm overflow-hidden group cursor-pointer"
          >
            <OptimizedImage
              src={story.image}
              alt={story.headline}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="256px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#002f6c]/95 via-[#002f6c]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-3">
              <p className="text-white text-xs font-bold leading-snug line-clamp-3">{story.headline}</p>
              <p className="world-kicker text-[#fcb700] text-[10px] mt-1">{story.author}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
