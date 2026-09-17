"use client";

import React from "react";
import Link from "next/link";
import { getMeshGroupForSlug, MAJOR_CATEGORY_HUBS } from "@/lib/topic-mesh";

interface ArticleTopicMeshProps {
  categorySlug?: string;
  categoryName?: string;
  className?: string;
}

export function ArticleTopicMesh({
  categorySlug = "creator-economy",
  categoryName,
  className = "",
}: ArticleTopicMeshProps) {
  const group = getMeshGroupForSlug(categorySlug);
  const displayLabel = categoryName || group.label;

  return (
    <section
      aria-label={`Imperialpedia Topic Explorer: ${displayLabel}`}
      className={`my-16 overflow-hidden rounded-none sm:rounded-xl bg-white dark:bg-black border-4 border-black dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(200,16,46,0.4)] ${className}`}
    >
      {/* ── Imperialpedia Heavy Banner Bar ── */}
      <div className="bg-black text-white px-6 sm:px-8 py-4 border-b-6 border-[#c8102e] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-[#c8102e] text-white text-xs sm:text-sm font-black uppercase tracking-tighter px-3 py-1 -skew-x-12 inline-block shadow-sm">
            IMPERIALPEDIA
          </span>
          <span className="bg-[#ffcc00] text-black text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-2xs">
            HOT COVERAGE
          </span>
        </div>
        <Link
          href={group.href}
          className="text-xs font-black uppercase tracking-wider text-white hover:text-[#ffcc00] transition-colors flex items-center gap-1 bg-[#1a1a1a] px-3.5 py-1.5 border border-slate-700"
        >
          EXPLORE ALL {displayLabel.toUpperCase()} →
        </Link>
      </div>

      <div className="p-6 sm:p-8 md:p-10 bg-[#f9f9fb] dark:bg-slate-950">
        {/* ── Imperialpedia Main Section Title ── */}
        <div className="mb-8 border-b-4 border-black dark:border-slate-800 pb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-3 w-3 bg-[#c8102e] inline-block -skew-x-12" />
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#c8102e]">
                TRENDING EDITORIAL MESH
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tighter uppercase font-serif">
              TRENDING IN{" "}
              <Link
                href={group.href}
                className="text-[#c8102e] underline decoration-black dark:decoration-white decoration-4 underline-offset-6 hover:text-black dark:hover:text-white transition-colors"
              >
                {displayLabel}
              </Link>
            </h2>
          </div>
          <div className="bg-black text-white text-xs font-mono font-bold px-3 py-1.5 rounded-2xs uppercase tracking-widest hidden sm:block">
            TOP STORIES &amp; GUIDES
          </div>
        </div>

        {/* ── Imperialpedia Pill Tags ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {group.items.map((item) => {
            const isActive = item.slug === categorySlug;
            return (
              <Link
                key={item.slug}
                href={item.href}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border-2 ${
                  isActive
                    ? "bg-[#c8102e] text-white border-[#c8102e] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    : "bg-white dark:bg-slate-900 text-black dark:text-white border-black dark:border-slate-700 hover:bg-black hover:text-white hover:border-black"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
        </div>

        {/* ── Imperialpedia Hot Stories Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {group.items.map((item, colIdx) => (
            <div
              key={item.slug}
              className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(200,16,46,0.3)] hover:-translate-y-1 transition-all flex flex-col justify-between relative"
            >
              {/* Top Accent Strip */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-4 border-b-2 border-black dark:border-slate-800 pb-3 pt-1">
                  <Link
                    href={item.href}
                    className="text-xs font-black uppercase tracking-widest text-black dark:text-white hover:text-[#c8102e] transition-colors"
                  >
                    {item.title}
                  </Link>
                  <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 -skew-x-6">
                    #{colIdx + 1} HOT
                  </span>
                </div>

                <ul className="space-y-4">
                  {item.featuredGuides.map((guide, idx) => (
                    <li key={idx}>
                      <Link
                        href={guide.href}
                        className="group text-xs sm:text-[13.5px] font-black text-black dark:text-slate-100 hover:text-[#c8102e] dark:hover:text-[#c8102e] transition-colors leading-tight flex items-start gap-3"
                      >
                        <span className="text-[#c8102e] font-black text-sm shrink-0 font-mono">
                          0{idx + 1}.
                        </span>
                        <span className="group-hover:underline underline-offset-2">
                          {guide.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-3 border-t-2 border-slate-200 dark:border-slate-800">
                <Link
                  href={item.href}
                  className="text-[11px] font-black uppercase tracking-wider text-[#c8102e] hover:text-black dark:hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>SEE ALL {item.title.toUpperCase()}</span>
                  <span className="font-bold text-lg">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ── Imperialpedia Site Directory Footer Ticker ── */}
        <div className="pt-6 border-t-4 border-black dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
              IMPERIALPEDIA DIRECTORY
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-slate-300">
              ALL IMPERIALPEDIA HUBS
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MAJOR_CATEGORY_HUBS.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className="text-xs font-black uppercase tracking-wider text-black dark:text-white bg-white dark:bg-slate-900 px-3.5 py-2 border-2 border-black dark:border-slate-700 hover:bg-[#c8102e] hover:text-white hover:border-[#c8102e] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {hub.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
