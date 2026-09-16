import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TopicGroup } from "./types";
import { ArticleCard } from "./ArticleCard";

/**
 * A topic row: section heading with accent rule + a responsive grid of cards.
 * The repeated building block of the Imperialpedia homepage body. When the
 * category has a real photo attached (admin Categories → Category Photo),
 * it renders as a wide banner behind the heading instead of plain text.
 */
export function TopicSection({ group }: { group: TopicGroup }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t-2 border-black dark:border-slate-800">
      {group.categoryImage && (
        <Link
          href={group.href}
          className="relative mb-6 block aspect-[21/6] w-full overflow-hidden border-3 border-black dark:border-slate-700 bg-muted shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <Image
            src={group.categoryImage}
            alt={group.title}
            fill
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-[#c8102e] text-white text-xs font-black uppercase tracking-widest px-3 py-1 -skew-x-12">
                TOPIC HUB
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white font-serif drop-shadow-md">
                {group.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-black uppercase text-[#ffcc00] hidden sm:inline-block">
              VIEW CATEGORY →
            </span>
          </div>
        </Link>
      )}

      {!group.categoryImage && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6 pb-3 border-b-3 border-black dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-12 shrink-0">
              IMPERIALPEDIA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter font-serif text-black dark:text-white">
              {group.title}
            </h2>
          </div>
          <Link
            href={group.href}
            className="group inline-flex items-center gap-1.5 self-start text-xs font-mono font-black uppercase tracking-wider text-[#c8102e] hover:text-black dark:hover:text-white transition-colors sm:self-auto"
          >
            <span>MORE COVERAGE</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {group.articles.map((a) => (
          <ArticleCard key={a.href + a.title} article={a} />
        ))}
      </div>
    </section>
  );
}
