"use client";
import { useState } from "react";
import Link from "next/link";
import { ImperialpediaMark } from "@/components/icons/ImperialpediaMark";
import { navCategories } from "@/lib/data/worldData";

/**
 * Shared dark CNBC-style masthead for /world, /news, /market-news — promoted
 * from world/TopNav.tsx (nothing about it was actually /world-specific; its
 * links already point cross-site to /markets, /personal-finance, /terms) so
 * all three routes share one nav instead of three near-duplicate copies.
 * Re-themed from the original light (`bg-white`) version to the canonical
 * CNBC black/red palette (`#ce2b2b` → `hsl(var(--cnbc-red))`) as part of the
 * same move, to avoid a separate follow-up edit.
 */
export default function TopNav() {
  const [activeCategory, setActiveCategory] = useState("World");

  return (
    <header className="bg-black border-b border-white/15 sticky top-0 z-50">
      {/* Logo bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="Imperialpedia home"
            className="flex items-center gap-1.5 bg-[hsl(var(--cnbc-red))] text-white px-2 py-1 leading-none"
          >
            <ImperialpediaMark className="h-4 w-4 text-white" />
            <span className="world-kicker font-black text-sm tracking-wide">IMPERIALPEDIA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-xs text-white/60 font-medium">
            <a href="/markets" className="hover:text-[hsl(var(--cnbc-red))] transition-colors px-2 py-1">Markets</a>
            <span className="text-white/20">|</span>
            <a href="/personal-finance" className="hover:text-[hsl(var(--cnbc-red))] transition-colors px-2 py-1">Personal Finance</a>
            <span className="text-white/20">|</span>
            <a href="/terms" className="hover:text-[hsl(var(--cnbc-red))] transition-colors px-2 py-1">Glossary</a>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="hidden sm:block">Wed, Apr 8, 2026</span>
          <button className="world-kicker bg-[hsl(var(--cnbc-red))] text-white text-xs font-bold px-3 py-1.5 rounded-sm hover:opacity-90 transition-opacity">
            SUBSCRIBE
          </button>
          <button className="text-white/60 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category nav */}
      <div className="overflow-x-auto scrollbar-hide">
        <nav className="flex items-center px-4 gap-0 min-w-max">
          {navCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`world-kicker text-xs font-semibold tracking-wide px-3 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "border-[hsl(var(--cnbc-red))] text-[hsl(var(--cnbc-red))]"
                  : "border-transparent text-white/60 hover:text-[hsl(var(--cnbc-red))] hover:border-white/30"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
