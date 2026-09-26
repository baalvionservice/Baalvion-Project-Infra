import React from "react";
import Link from "next/link";
import type { Article as LandingArticle } from "@/components/landing/imperialpedia/types";
import { HomeSectionHeading } from "./HomeSectionHeading";

type Props = {
  articles: LandingArticle[];
};

/**
 * "Popular Reads" — a headline-only, numbered rail (Outlook Money's
 * text-only "Popular" pattern), deliberately contrasted against the
 * image-rich sections above it. Sourced from `getHomeEditorial`'s dedup
 * pool, so it's always whatever's left after every other homepage section
 * has taken its picks — never a repeat headline, and never a fabricated
 * "trending by views" claim the site can't actually back with analytics.
 */
export function PopularReads({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <HomeSectionHeading title="POPULAR READS // TRENDING" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((a, i) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col justify-between bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[7px_7px_0px_0px_rgba(200,16,46,1)] transition-all relative rounded-xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-[#c8102e] text-white text-xs font-black font-mono tracking-widest px-2.5 py-0.5 -skew-x-12 inline-block">
                  #{String(i + 1).padStart(2, "0")} HOT
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c8102e]">
                  TRENDING
                </span>
              </div>
              <h3 className="text-base font-black uppercase font-serif leading-tight text-black dark:text-white group-hover:text-[#c8102e] transition-colors line-clamp-3">
                {a.title}
              </h3>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono font-bold text-slate-500">
              <span>READ STORY</span>
              <span className="text-[#c8102e] group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
