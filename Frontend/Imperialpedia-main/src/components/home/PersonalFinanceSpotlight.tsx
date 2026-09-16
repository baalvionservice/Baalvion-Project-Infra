import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArticleCard } from "@/components/landing/imperialpedia/ArticleCard";
import { HomeSectionHeading } from "./HomeSectionHeading";
import type { PersonalFinanceSpotlight as PersonalFinanceSpotlightData } from "./getHomeEditorial";
import { CategoryBadge } from "@/components/common/CategoryBadge";

type Props = {
  spotlight: PersonalFinanceSpotlightData | null;
};

/**
 * Dedicated "Personal Finance" homepage section — a lead story beside a
 * stack of secondary cards and a headline-only "Popular" list underneath,
 * mirroring how reference personal-finance sites (e.g. Outlook Money) give
 * the category its own spotlight rather than a generic topic row. Renders
 * nothing until the category has real published content — see
 * `getHomeEditorial.ts` for the dedup pass that keeps every pick here
 * distinct from the lead/topic/latest sections above it.
 */
export function PersonalFinanceSpotlight({ spotlight }: Props) {
  if (!spotlight) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <HomeSectionHeading title="PERSONAL FINANCE SPOTLIGHT" href="/personal-finance" hrefLabel="EXPLORE CATEGORY →" />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8">
        {/* Main Feature */}
        <Link 
          href={spotlight.lead.href} 
          className="group block bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative rounded-xs"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
          <div className="relative aspect-[16/10] w-full overflow-hidden border-2 border-black dark:border-slate-700 bg-muted mt-1">
            <Image
              src={spotlight.lead.image}
              alt={spotlight.lead.title}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
                FEATURED SPOTLIGHT
              </span>
              <CategoryBadge category={spotlight.lead.category} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase font-serif leading-tight text-black dark:text-white group-hover:text-[#c8102e] transition-colors">
              {spotlight.lead.title}
            </h3>
            {spotlight.lead.dek && (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">{spotlight.lead.dek}</p>
            )}
          </div>
        </Link>

        {/* Secondary & Popular */}
        <div className="space-y-6">
          {spotlight.secondary.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {spotlight.secondary.map((a) => (
                <ArticleCard key={a.href} article={a} variant="row" />
              ))}
            </div>
          )}

          {spotlight.popular.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#c8102e]" />
              <div className="flex items-center gap-2 mb-3 pt-1 border-b-2 border-black dark:border-slate-800 pb-2">
                <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                  IMPERIALPEDIA
                </span>
                <h4 className="text-xs font-black uppercase tracking-widest text-black dark:text-white font-mono">
                  POPULAR IN PERSONAL FINANCE
                </h4>
              </div>
              <ul className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                {spotlight.popular.map((a) => (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="group flex items-center justify-between py-2.5 text-sm font-black uppercase font-serif text-black dark:text-white hover:text-[#c8102e] transition-colors line-clamp-2"
                    >
                      <span>{a.title}</span>
                      <span className="text-[#c8102e] font-mono text-xs ml-2 shrink-0 group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
