"use client";
import { useState } from "react";
import { navCategories } from "@/lib/data/worldData";

export default function TopNav() {
  const [activeCategory, setActiveCategory] = useState("World");

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Logo bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <div className="bg-[#CC0000] text-white font-black text-lg px-2 py-0.5 tracking-tight leading-none">CNBC</div>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-xs text-gray-600 font-medium">
            <a href="#" className="hover:text-[#CC0000] transition-colors px-2 py-1">PRO</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-[#CC0000] transition-colors px-2 py-1">Make It</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-[#CC0000] transition-colors px-2 py-1">Select</a>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="hidden sm:block">Wed, Apr 8, 2026</span>
          <button className="bg-[#CC0000] text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-red-700 transition-colors">
            WATCH LIVE
          </button>
          <button className="text-gray-600 hover:text-gray-900">
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
              className={`text-xs font-semibold tracking-wide px-3 py-3 border-b-2 transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? "border-[#CC0000] text-[#CC0000]"
                  : "border-transparent text-gray-600 hover:text-[#CC0000] hover:border-gray-300"
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
