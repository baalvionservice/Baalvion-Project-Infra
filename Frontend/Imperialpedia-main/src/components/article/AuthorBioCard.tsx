"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Award, CheckCircle2, User } from "lucide-react";
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
      className={`my-12 rounded-2xl border border-gray-200 bg-gray-50/60 p-6 sm:p-8 space-y-6 ${className}`}
    >
      {/* Primary Author Profile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-full border-2 border-gray-200 bg-white shadow-sm flex items-center justify-center">
          {author?.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={displayAuthorName}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#1d4fc4]/10 text-[#1d4fc4] font-bold text-xl">
              {displayAuthorName.charAt(0)}
            </div>
          )}
        </div>

        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#1d4fc4]">
              About the Author
            </span>
          </div>
          <h4 className="text-lg font-bold text-gray-900 leading-tight">
            {author?.slug ? (
              <Link href={`/authors/${author.slug}`} className="hover:text-[#1d4fc4] hover:underline">
                {displayAuthorName}
              </Link>
            ) : (
              displayAuthorName
            )}
          </h4>
          <p className="text-xs font-semibold text-gray-600">{displayAuthorTitle}</p>
          <p className="text-xs text-gray-600 leading-relaxed pt-1">{displayAuthorBio}</p>
        </div>
      </div>

      {/* Reviewer and Fact-Checker Badges (E-E-A-T) */}
      {(reviewer || factChecker) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200/80">
          {reviewer && (
            <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 border border-gray-200/60 shadow-xs">
              <ShieldCheck className="h-4 w-4 text-[#1d4fc4] shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-gray-500">Fact Reviewed By: </span>
                <span className="font-bold text-gray-900">{reviewer.name}</span>
                {reviewer.title && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{reviewer.title}</p>
                )}
              </div>
            </div>
          )}

          {factChecker && (
            <div className="flex items-start gap-2.5 rounded-xl bg-white p-3 border border-gray-200/60 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-gray-500">Fact Checked By: </span>
                <span className="font-bold text-gray-900">{factChecker.name}</span>
                {factChecker.title && (
                  <p className="text-[11px] text-gray-500 mt-0.5">{factChecker.title}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editorial Standards Note */}
      <div className="flex items-center gap-2 pt-2 text-[11px] text-gray-500">
        <Award className="h-3.5 w-3.5 text-[#1d4fc4]" />
        <span>
          Imperialpedia is committed to objective, independent, and strictly fact-checked financial journalism.{" "}
          <Link href="/editorial-policy" className="font-semibold text-[#1d4fc4] hover:underline">
            Read our Editorial Policy
          </Link>
        </span>
      </div>
    </div>
  );
}
