import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  title: string;
  href?: string;
  hrefLabel?: string;
};

/**
 * Shared section heading for homepage discovery rails — mirrors TopicSection's
 * accent-bar + "More" link pattern so the whole homepage reads as one system
 * instead of mixing the editorial layer with a different visual language.
 */
export function HomeSectionHeading({ title, href, hrefLabel = "MORE" }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6 pb-3 border-b-3 border-black dark:border-slate-700">
      <div className="flex items-center gap-3">
        <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-12 shrink-0">
          IMPERIALPEDIA
        </span>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter font-serif text-black dark:text-white">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 self-start text-xs font-mono font-black uppercase tracking-wider text-[#c8102e] hover:text-black dark:hover:text-white transition-colors sm:self-auto"
        >
          <span>{hrefLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
