import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { HomeSectionHeading } from "./HomeSectionHeading";

const SOURCES = [
  { name: "Federal Reserve", url: "https://www.federalreserve.gov" },
  { name: "SEC", url: "https://www.sec.gov" },
  { name: "FINRA", url: "https://www.finra.org" },
  { name: "IRS", url: "https://www.irs.gov" },
  { name: "Bureau of Labor Statistics", url: "https://www.bls.gov" },
  { name: "Bureau of Economic Analysis", url: "https://www.bea.gov" },
  { name: "World Bank", url: "https://www.worldbank.org" },
  { name: "IMF", url: "https://www.imf.org" },
] as const;

/**
 * Homepage teaser for the full Sources & Methodology page — explains how
 * sources are selected rather than just listing logos, per the same
 * reasoning as the full page: naming an institution without saying how it's
 * used isn't a real trust signal.
 */
export function SourcesMethodology() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      <HomeSectionHeading title="OUR SOURCES // VERIFIED CITATIONS" href="/methodology" hrefLabel="FULL METHODOLOGY →" />
      
      <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative rounded-xs">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
        
        <p className="max-w-3xl text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-sans pt-1">
          For factual financial and economic information, Imperialpedia cites authoritative primary sources directly
          including the regulatory institutions below. Every published article contains its own verified
          &ldquo;Sources &amp; References&rdquo; section.
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {SOURCES.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 border-2 border-black dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-mono font-black uppercase text-black dark:text-white hover:bg-[#c8102e] hover:text-white hover:border-[#c8102e] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span>{source.name}</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
