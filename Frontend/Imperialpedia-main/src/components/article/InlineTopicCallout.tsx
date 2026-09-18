import React from "react";
import Link from "next/link";
import type { FeaturedGuide } from "@/lib/topic-mesh";

interface InlineTopicCalloutProps {
  /** Pre-computed server-side (SUBTOPIC_FEATURED_GUIDES[categorySlug]) — see
   *  ArticleTopicMesh.tsx for why topic-mesh/topic-config never get imported
   *  directly by this component. */
  guides?: FeaturedGuide[];
  label: string;
  topicHref: string;
}

/**
 * Imperialpedia Style Inline "MORE ON IMPERIALPEDIA" mid-article callout.
 * Shows 3 curated guide links. Injected after the lead paragraphs
 * (between paragraphs 2-3).
 */
export function InlineTopicCallout({ guides, label, topicHref }: InlineTopicCalloutProps) {
  if (!guides || guides.length === 0) return null;

  return (
    <aside
      aria-label={`Read more on ${label}`}
      className="my-9 border-l-6 border-[#c8102e] bg-black text-white p-5 sm:p-6 rounded-r-lg shadow-lg relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2.5">
        <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 -skew-x-6">
          IMPERIALPEDIA READ MORE
        </span>
        <p className="text-xs font-black uppercase tracking-widest text-slate-300 font-mono">
          MORE ON{" "}
          <Link href={topicHref} className="text-[#ffcc00] hover:underline">
            {label.toUpperCase()}
          </Link>
        </p>
      </div>

      <ul className="space-y-3">
        {guides.slice(0, 3).map((guide, idx) => (
          <li key={idx} className="flex gap-2.5 items-start">
            <span className="text-[#c8102e] font-mono font-black text-sm shrink-0">
              0{idx + 1}.
            </span>
            <Link
              href={guide.href}
              className="text-xs sm:text-[13.5px] font-bold text-white hover:text-[#ffcc00] leading-snug transition-colors"
            >
              {guide.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
