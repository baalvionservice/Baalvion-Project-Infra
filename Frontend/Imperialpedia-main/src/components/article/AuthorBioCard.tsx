"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, Award } from "lucide-react";
import type { ResolvedAuthor } from "@/services/data/cms-public";

interface AuthorBioCardProps {
  author?: ResolvedAuthor | null;
  reviewer?: ResolvedAuthor | null;
  factChecker?: ResolvedAuthor | null;
  className?: string;
}

export function AuthorBioCard({
  author,
  reviewer,
  factChecker,
  className = "",
}: AuthorBioCardProps) {
  const displayAuthorName = author?.name || "Imperialpedia Editorial Board";
  const displayAuthorTitle = author?.title || "Financial Editorial Team & Research Analysts";
  const displayAuthorBio =
    author?.bio ||
    "Our certified financial experts, CFPs, and market analysts verify all guidance against regulatory filings, primary financial sources, and industry-standard best practices.";

  return (
    <div
      className={`my-12 bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)] p-6 sm:p-8 space-y-6 relative rounded-xs ${className}`}
    >
      {/* Top Red Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />

      {/* Primary Author Profile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-1">
        <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-full border-3 border-black bg-white shadow-md flex items-center justify-center">
          {author?.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={displayAuthorName}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black text-[#c8102e] font-black text-2xl">
              {displayAuthorName.charAt(0)}
            </div>
          )}
        </div>

        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 -skew-x-6">
              IMPERIALPEDIA AUTHOR
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
              // EDITORIAL BOARD
            </span>
          </div>
          <h4 className="text-xl font-black text-black dark:text-white leading-tight uppercase font-serif">
            {author?.slug ? (
              <Link href={`/authors/${author.slug}`} className="hover:text-[#c8102e] hover:underline">
                {displayAuthorName}
              </Link>
            ) : (
              displayAuthorName
            )}
          </h4>
          <p className="text-xs font-mono font-bold text-[#c8102e] uppercase">{displayAuthorTitle}</p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{displayAuthorBio}</p>
        </div>
      </div>

      {/* Reviewer and Fact-Checker Badges (E-E-A-T) */}
      {(reviewer || factChecker) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t-2 border-black dark:border-slate-800">
          {reviewer && (
            <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800 p-3.5 border-2 border-black dark:border-slate-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="h-4 w-4 text-[#c8102e] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-mono font-bold text-slate-500 uppercase">REVIEWED BY: </span>
                <span className="font-black text-black dark:text-white">{reviewer.name}</span>
                {reviewer.title && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{reviewer.title}</p>
                )}
              </div>
            </div>
          )}

          {factChecker && (
            <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800 p-3.5 border-2 border-black dark:border-slate-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-mono font-bold text-slate-500 uppercase">FACT CHECKED BY: </span>
                <span className="font-black text-black dark:text-white">{factChecker.name}</span>
                {factChecker.title && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{factChecker.title}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editorial Standards Note */}
      <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <Award className="h-4 w-4 text-[#c8102e] shrink-0" />
        <span>
          Imperialpedia is committed to objective, independent, and strictly fact-checked financial journalism.{" "}
          <Link href="/editorial-policy" className="font-black text-[#c8102e] hover:underline">
            Read our Editorial Policy →
          </Link>
        </span>
      </div>
    </div>
  );
}
