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
 * Strips leading numbers like "1." "2." etc., then slugifies.
 */
function toSlug(text: string, index: number): string {
  const cleaned = text
    .replace(/^\d+[\.\)]\s*/, "") // strip leading "1." or "1)" numbering
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
  // Only extract primary H2 sections for a clean editorial TOC
  const headingRegex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const list: TocItem[] = [];
  let match;
  let index = 0;

  while ((match = headingRegex.exec(html)) !== null) {
    const rawText = match[1].replace(/<[^>]+>/g, "").trim();
    if (!rawText) continue;

    // Display text: strip leading numbering
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

    // Find ALL H2 headings across the article body
    const allArticleBodies = document.querySelectorAll(".article-body");
    const allHeadings: HTMLElement[] = [];
    allArticleBodies.forEach((body) => {
      body.querySelectorAll("h2").forEach((h) => allHeadings.push(h as HTMLElement));
    });

    // Assign IDs in DOM order to match TOC slugs
    allHeadings.forEach((h, index) => {
      const tocItem = initialItems[index];
      if (tocItem) {
        h.id = tocItem.id;
      }
    });

    // Real-time scroll listener to track active section with small triangle
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
      const offset = 85; // navbar height compensation
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }
  }, []);

  if (items.length < 2) return null;

  if (variant === "left-rail") {
    return (
      <aside aria-label="Table of Contents" className={`w-full ${className}`}>
        {/* ── DESKTOP TOC ── */}
        <div className="hidden lg:block">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300 dark:border-gray-700">
            <span
              className="toc-heading text-[13px] sm:text-[13.5px] font-bold uppercase text-[#121212] dark:text-white"
              style={{ fontFamily: "'Corinthian', Georgia, serif", letterSpacing: "0.08em" }}
            >
              TABLE OF CONTENTS
            </span>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11.5px] font-semibold text-[#1d4fc4] dark:text-blue-400 hover:underline ml-2 shrink-0 cursor-pointer"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>

          {/* Link list with Small Triangle Arrow Indicator */}
          {isExpanded && (
            <nav>
              <ul className="space-y-0.5">
                {items.map((item, i) => {
                  const isActive = activeId === item.id;
                  return (
                    <li key={`${item.id}-${i}`}>
                      <button
                        type="button"
                        onClick={() => scrollTo(item.id)}
                        className={`w-full text-left flex items-start py-[6px] text-[13px] leading-[1.4] transition-all font-sans cursor-pointer group ${
                          isActive
                            ? "font-bold text-[#121212] dark:text-white"
                            : "text-[#555555] dark:text-gray-400 hover:text-[#121212] dark:hover:text-white font-normal"
                        }`}
                      >
                        {/* Small Left Triangle Indicator */}
                        <span
                          className={`inline-flex items-center justify-center shrink-0 w-3.5 h-4 mr-1 text-[8.5px] leading-none transition-all ${
                            isActive
                              ? "opacity-100 text-[#121212] dark:text-white translate-x-0"
                              : "opacity-0 text-transparent -translate-x-1"
                          }`}
                        >
                          ▶
                        </span>
                        <span className="flex-1">{item.text}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>

        {/* ── MOBILE ACCORDION ── */}
        <div className="lg:hidden my-5 border border-gray-200 dark:border-gray-700 rounded-sm">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-gray-900"
          >
            <span
              className="toc-heading text-[13px] font-bold uppercase text-[#121212] dark:text-white"
              style={{ fontFamily: "'Corinthian', Georgia, serif", letterSpacing: "0.08em" }}
            >
              TABLE OF CONTENTS
            </span>
            {mobileOpen
              ? <ChevronUp className="h-4 w-4 text-gray-500" />
              : <ChevronDown className="h-4 w-4 text-gray-500" />
            }
          </button>
          {mobileOpen && (
            <ul className="px-4 py-2 space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item, i) => {
                const isActive = activeId === item.id;
                return (
                  <li key={`${item.id}-mobile-${i}`}>
                    <button
                      type="button"
                      onClick={() => { scrollTo(item.id); setMobileOpen(false); }}
                      className={`w-full text-left flex items-center py-2.5 text-[13px] font-sans ${
                        isActive
                          ? "font-bold text-[#121212] dark:text-white"
                          : "text-[#555] dark:text-gray-300 hover:text-[#121212] dark:hover:text-white"
                      }`}
                    >
                      <span className={`inline-block mr-2 text-[8px] ${isActive ? "text-[#121212] dark:text-white" : "opacity-0"}`}>
                        ▶
                      </span>
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
    <nav className={`my-6 border-y border-gray-200 dark:border-gray-800 py-4 ${className}`}>
      <h3
        className="toc-heading text-[13px] font-bold uppercase text-[#121212] dark:text-white mb-3"
        style={{ fontFamily: "'Corinthian', Georgia, serif", letterSpacing: "0.08em" }}
      >
        TABLE OF CONTENTS
      </h3>
      <ul className="space-y-0.5 font-sans">
        {items.map((item, i) => {
          const isActive = activeId === item.id;
          return (
            <li key={`${item.id}-inline-${i}`}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left flex items-center py-1.5 text-[13px] ${
                  isActive ? "font-bold text-[#121212] dark:text-white" : "text-[#555] dark:text-gray-400 hover:text-[#121212] dark:hover:text-white"
                }`}
              >
                <span className={`inline-block mr-2 text-[8px] ${isActive ? "text-[#121212] dark:text-white" : "opacity-0"}`}>
                  ▶
                </span>
                {item.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
