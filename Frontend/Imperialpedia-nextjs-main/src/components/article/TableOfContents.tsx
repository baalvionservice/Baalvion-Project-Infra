"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  htmlContent?: string;
  className?: string;
  variant?: "left-rail" | "inline";
}

/**
 * Generate a clean slug ID from heading text.
 */
function toSlug(text: string, index: number): string {
  const cleaned = text
    .replace(/^\d+[\.\)]\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
  return cleaned || `section-${index}`;
}

function extractHeadingsFromString(html?: string): TocItem[] {
  if (!html) return [];
  const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  const list: TocItem[] = [];
  let match;
  let index = 0;

  while ((match = headingRegex.exec(html)) !== null) {
    const rawText = match[1].replace(/<[^>]+>/g, "").trim();
    if (!rawText) continue;

    const displayText = rawText.replace(/^\d+[\.\)]\s*/, "").trim();
    const id = toSlug(rawText, index);
    list.push({ id, text: displayText, level: 2 });
    index++;
  }
  return list;
}

export function TableOfContents({
  htmlContent,
  className = "",
  variant = "left-rail",
}: TableOfContentsProps) {
  const initialItems = useMemo(() => extractHeadingsFromString(htmlContent), [htmlContent]);
  const [items, setItems] = useState<TocItem[]>(initialItems);
  const [activeId, setActiveId] = useState<string>(initialItems[0]?.id || "");
  const [isExpanded, setIsExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (initialItems.length > 0) {
      setItems(initialItems);
      if (!activeId) setActiveId(initialItems[0].id);
    }

    const allArticleBodies = document.querySelectorAll(".article-body");
    const allHeadings: HTMLElement[] = [];
    allArticleBodies.forEach((body) => {
      body.querySelectorAll("h2").forEach((h) => allHeadings.push(h as HTMLElement));
    });

    allHeadings.forEach((h, index) => {
      const tocItem = initialItems[index];
      if (tocItem) {
        h.id = tocItem.id;
      }
    });

    const handleScroll = () => {
      if (allHeadings.length === 0) return;
      const scrollY = window.scrollY;
      const navOffset = 110;

      let currentActive = allHeadings[0].id;
      for (let i = 0; i < allHeadings.length; i++) {
        const h = allHeadings[i];
        const headingTop = h.getBoundingClientRect().top + scrollY - navOffset;
        if (scrollY >= headingTop - 15) {
          currentActive = h.id;
        }
      }
      setActiveId(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [htmlContent, initialItems]);

  const scrollTo = useCallback((id: string) => {
    let target = document.getElementById(id);
    if (!target) {
      const allH2 = document.querySelectorAll(".article-body h2");
      allH2.forEach((h, index) => {
        if (h.id === id || toSlug(h.textContent || "", index) === id) {
          target = h as HTMLElement;
          h.id = id;
        }
      });
    }
    if (target) {
      const offset = 85;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }
  }, []);

  if (items.length < 1) return null;

  if (variant === "left-rail") {
    return (
      <aside aria-label="Imperialpedia Table of Contents" className={`w-full ${className}`}>
        {/* ── Imperialpedia Heavy Left-Rail Box ── */}
        <div className="hidden lg:block bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="h-1.5 bg-[#c8102e] absolute top-0 left-0 right-0" />
          
          {/* Header row */}
          <div className="flex items-center justify-between mb-3 pt-1 border-b-2 border-black dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="bg-[#c8102e] text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 -skew-x-6">
                IMP INDEX
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-black dark:text-white font-mono">
                ON THIS PAGE
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] font-black uppercase tracking-wider text-[#c8102e] hover:underline cursor-pointer"
            >
              {isExpanded ? "HIDE" : "SHOW"}
            </button>
          </div>

          {/* Link list */}
          {isExpanded && (
            <nav>
              <ul className="space-y-1">
                {items.map((item, i) => {
                  const isActive = activeId === item.id;
                  return (
                    <li key={`${item.id}-${i}`}>
                      <button
                        type="button"
                        onClick={() => scrollTo(item.id)}
                        className={`w-full text-left flex items-start py-1.5 px-2 rounded-xs text-xs transition-all font-sans cursor-pointer ${
                          isActive
                            ? "bg-black text-white font-bold dark:bg-slate-800"
                            : "text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                        }`}
                      >
                        <span
                          className={`inline-block shrink-0 mr-1.5 text-[10px] font-mono ${
                            isActive ? "text-[#c8102e]" : "text-slate-400"
                          }`}
                        >
                          0{i + 1}.
                        </span>
                        <span className="flex-1 leading-snug line-clamp-2">{item.text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>

        {/* ── MOBILE ACCORDION ── */}
        <div className="lg:hidden my-5 border-3 border-black dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-between w-full px-4 py-3 bg-black text-white"
          >
            <div className="flex items-center gap-2">
              <span className="bg-[#c8102e] text-white text-[10px] font-black px-2 py-0.5 -skew-x-6">
                IMPERIALPEDIA
              </span>
              <span className="text-xs font-black uppercase tracking-widest font-mono">
                ARTICLE INDEX ({items.length})
              </span>
            </div>
            {mobileOpen ? <ChevronUp className="h-4 w-4 text-white" /> : <ChevronDown className="h-4 w-4 text-white" />}
          </button>
          {mobileOpen && (
            <ul className="px-4 py-3 space-y-1.5 bg-white dark:bg-slate-900">
              {items.map((item, i) => {
                const isActive = activeId === item.id;
                return (
                  <li key={`${item.id}-mobile-${i}`}>
                    <button
                      type="button"
                      onClick={() => { scrollTo(item.id); setMobileOpen(false); }}
                      className={`w-full text-left flex items-center py-2 px-2 text-xs font-bold ${
                        isActive
                          ? "bg-black text-white"
                          : "text-slate-900 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-[#c8102e] font-mono mr-2">0{i + 1}.</span>
                      {item.text}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    );
  }

  // Inline fallback
  return (
    <nav className={`my-8 border-3 border-black dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <div className="flex items-center gap-2 mb-3 border-b-2 border-black pb-2">
        <span className="bg-[#c8102e] text-white text-[10px] font-black px-2 py-0.5 -skew-x-6">
          IMPERIALPEDIA
        </span>
        <h3 className="text-xs font-black uppercase tracking-widest text-black dark:text-white font-mono">
          ARTICLE INDEX
        </h3>
      </div>
      <ul className="space-y-1.5 font-sans">
        {items.map((item, i) => {
          const isActive = activeId === item.id;
          return (
            <li key={`${item.id}-inline-${i}`}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left flex items-center py-1.5 px-2 text-xs font-bold ${
                  isActive ? "bg-black text-white" : "text-slate-900 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="text-[#c8102e] font-mono mr-2">0{i + 1}.</span>
                {item.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
