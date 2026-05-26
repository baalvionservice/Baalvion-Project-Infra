'use client';
import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { NewsArticle } from "@/data/mockNews";

interface ExpandingOpportunitiesProps {
  news: NewsArticle[];
}

const ExpandingOpportunities = ({ news }: ExpandingOpportunitiesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = 300;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 2;
    scrollRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).toUpperCase();
  };

  const isVideo = (article: NewsArticle) => article.category === "video";

  return (
    <div className="w-full py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 px-1">
        <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#0a1628] uppercase">
          Expanding Opportunity
        </h2>
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => scroll("left")}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="text-gray-800 hover:text-black transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Scrollable Card Row */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth pl-0.5 -mr-3 pr-3 sm:pr-0 sm:mr-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {news.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none w-[85vw] sm:w-[300px] max-w-[300px] group cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative w-full aspect-video sm:h-[175px] sm:aspect-auto overflow-hidden bg-gray-200">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Video badge */}
              {isVideo(article) && (
                <>
                  {/* Play button overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="bg-amber-400 rounded-full w-9 h-9 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  {/* VIDEO label + duration */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded">
                    <span className="text-[10px] font-bold text-white tracking-wider">
                      VIDEO
                    </span>
                    <span className="text-[10px] text-white">
                      {article.content ?? ""}
                    </span>
                  </div>
                </>
              )}

              {/* Source badge top-right */}
              {article.source && (
                <div className="absolute top-2 right-2 bg-[#1a237e] px-1.5 py-0.5 rounded text-[9px] text-white font-semibold uppercase tracking-wide leading-tight max-w-[90px] text-right">
                  {article.source}
                </div>
              )}
            </div>

            {/* Text content */}
            <div className="pt-2">
              <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-3">
                {article.title}
              </h3>
              <p className="mt-1.5 text-[11px] font-semibold text-gray-400 tracking-wide uppercase">
                {formatDate(article.publishedAt)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default ExpandingOpportunities;