import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isRetiredPath } from "@/lib/content/retired-paths";

type Props = {
  term: string;
  definition: string;
  href: string;
};

/**
 * Imperialpedia Style "TERM OF THE DAY" Callout Box:
 * High-impact black & gold box card with crimson red badge tag.
 */
export function TermOfDay({ term, definition, href }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-900 border-4 border-black dark:border-slate-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(200,16,46,0.3)] relative overflow-hidden rounded-xs">
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />

        <div className="flex flex-col md:flex-row items-stretch">
          {/* Left Block */}
          <div className="bg-black text-white p-6 md:w-80 md:shrink-0 border-b-4 md:border-b-0 md:border-r-4 border-black flex flex-col justify-center space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 -skew-x-6">
                IMPERIALPEDIA
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ffcc00]">
                DICTIONARY HOOK
              </span>
            </div>
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
              TERM OF THE DAY
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase font-serif text-[#ffcc00] tracking-tight">
              {term}
            </h3>
          </div>

          {/* Right Block */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-slate-50/60 dark:bg-slate-900/40">
            <p className="text-base sm:text-lg text-slate-900 dark:text-slate-100 font-bold leading-relaxed">
              {definition}
            </p>
            {!isRetiredPath(href) && (
              <div>
                <Link
                  href={href}
                  className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#c8102e] hover:text-black dark:hover:text-white transition-colors"
                >
                  <span>READ FULL DEFINITION</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
