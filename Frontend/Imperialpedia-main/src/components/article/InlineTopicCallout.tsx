import React from "react";
import Link from "next/link";
import { SUBTOPIC_FEATURED_GUIDES } from "@/lib/topic-mesh";
import { topicCopy } from "@/lib/topic-config";

interface InlineTopicCalloutProps {
  categorySlug?: string;
  categoryName?: string;
}

/**
 * Imperialpedia Style Inline "MORE ON IMPERIALPEDIA" mid-article callout.
 * Shows 3 curated guide links. Injected after the lead paragraphs
 * (between paragraphs 2-3).
 */
export function InlineTopicCallout({
  categorySlug = "creator-economy",
  categoryName,
}: InlineTopicCalloutProps) {
  const guides = SUBTOPIC_FEATURED_GUIDES[categorySlug];
  if (!guides || guides.length === 0) return null;

  const copy = topicCopy(categorySlug);
  const label = categoryName || copy.title;
  const topicHref = `/${categorySlug}`;

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
