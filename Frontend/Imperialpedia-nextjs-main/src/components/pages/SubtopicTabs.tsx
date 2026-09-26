"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SiblingTopic } from "@/lib/topic-config";

interface SubtopicTabsProps {
  current: string;
  siblings: SiblingTopic[];
}

/**
 * Modern, sleek subcategory pill navigation tab bar.
 * Allows readers to switch between related subcategories (e.g. YouTube, Instagram, Website Monetization).
 */
export function SubtopicTabs({ current, siblings }: SubtopicTabsProps) {
  if (!siblings || siblings.length === 0) return null;

  return (
    <nav
      aria-label="Subcategory topics navigation"
      className="my-6 border-b border-border/60 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0"
    >
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 [mask-image:linear-gradient(to_right,white_90%,transparent_100%)]">
          {siblings.map((s) => {
            const isCurrent = s.slug === current;
            return (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 border",
                  isCurrent
                    ? "bg-[#1d4fc4] text-white border-[#1d4fc4] shadow-xs font-bold"
                    : "bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-[#1d4fc4]/40 hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-[#1d4fc4] dark:hover:text-blue-400"
                )}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

