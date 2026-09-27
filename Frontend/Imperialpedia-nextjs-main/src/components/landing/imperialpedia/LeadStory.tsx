import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Article } from "./types";
import { ArticleCard } from "./ArticleCard";

type Props = {
  lead: Article;
  leadRelated: Article[];
  secondaryLead: Article | null;
  secondaryLeadRelated: Article[];
  otherTopStories: Article[];
};

function HeroStory({ article, related, priority }: { article: Article; related: Article[]; priority?: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)] relative rounded-xs">
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
      
      <Link href={article.href} className="group block space-y-3.5 pt-1">
        <div className="relative aspect-[16/10] w-full overflow-hidden border-2 border-black dark:border-slate-700 bg-muted">
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
              LEAD STORY
            </span>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#c8102e]">
              // TOP EDITORIAL
            </p>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black leading-tight text-black dark:text-white font-serif uppercase group-hover:text-[#c8102e] transition-colors">
            {article.title}
          </h2>
          {article.dek && (
            <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">{article.dek}</p>
          )}
          {article.author && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
              <span>By <strong className="text-black dark:text-white uppercase font-serif">{article.author}</strong></span>
              <span className="text-[#c8102e] uppercase">READ FULL STORY →</span>
            </div>
          )}
        </div>
      </Link>

      {related.length > 0 && (
        <div className="mt-4 pt-3 border-t-2 border-black dark:border-slate-800">
          <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 mb-2 inline-block">
            IMPERIALPEDIA RELATED
          </span>
          <div className="mt-1 space-y-2">
            {related.map((r) => (
              <ArticleCard key={r.href} article={r} variant="row" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hero editorial block, Imperialpedia style: two lead stories side by side in black-bordered frames
 * followed by a headline-only "Other Top Stories" list.
 */
export function LeadStory({ lead, leadRelated, secondaryLead, secondaryLeadRelated, otherTopStories }: Props) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className={cn("grid grid-cols-1 gap-8 lg:gap-10", secondaryLead && "lg:grid-cols-2")}>
        <HeroStory article={lead} related={leadRelated} priority />
        {secondaryLead && <HeroStory article={secondaryLead} related={secondaryLeadRelated} />}
      </div>

      {otherTopStories.length > 0 && (
        <div className="mt-10 bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#c8102e]" />
          <div className="flex items-center gap-2 mb-4 border-b-2 border-black dark:border-slate-800 pb-3 pt-1">
            <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 -skew-x-6">
              IMPERIALPEDIA
            </span>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white font-mono">
              OTHER TOP HEADLINES
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
            {otherTopStories.map((a) => (
              <ArticleCard key={a.href} article={a} variant="row" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
