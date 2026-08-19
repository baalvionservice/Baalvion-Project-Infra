"use client";

import React from 'react';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { LawAuthor } from '@/data/authors';

interface ArticleAuthorBylineProps {
  authorName: string;
  matchedAuthor: LawAuthor | null;
}

/**
 * Interactive author-bio popover for the article byline. Split out from the
 * article page so the page itself can stay a Server Component — the byline
 * text is still server-rendered by the caller; only the popover behavior
 * needs the client. The "Last Updated" date lives in ArticleMetaHeader now,
 * not duplicated here.
 */
export function ArticleAuthorByline({ authorName, matchedAuthor }: ArticleAuthorBylineProps) {
  return (
    <div className="space-y-1 text-[14px] text-slate-600">
      <div className="flex flex-wrap items-center gap-1.5">
        Written by
        <Popover>
          <PopoverTrigger asChild>
            <span className="font-bold text-blue-700 cursor-pointer border-b border-blue-600 hover:text-blue-900 transition-colors leading-none">
              {authorName}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] max-w-[400px] p-0 shadow-2xl border-slate-200 rounded-lg bg-white overflow-hidden" align="start" sideOffset={8}>
            <div className="p-7 space-y-3">
              <p className="font-headline text-lg font-bold text-slate-900">
                {authorName}
              </p>
              {matchedAuthor ? (
                <>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-blue-700">
                    {matchedAuthor.title}
                  </p>
                  <p className="text-[12px] text-slate-500">{matchedAuthor.credentials}</p>
                  <p className="text-[14px] leading-relaxed text-slate-600 line-clamp-4">
                    {matchedAuthor.bio}
                  </p>
                  {matchedAuthor.expertise.length > 0 && (
                    <p className="text-[12px] text-slate-500">
                      Focus: {matchedAuthor.expertise.join(', ')}
                    </p>
                  )}
                  <Link
                    href={`/author/${matchedAuthor.slug}`}
                    className="inline-block text-[13px] font-bold text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    View full profile →
                  </Link>
                </>
              ) : (
                <p className="text-[14px] leading-relaxed text-slate-600">
                  Part of the Law Elite Network editorial team. Our guides are
                  researched and reviewed for accuracy and clarity, then kept current as
                  laws change. They provide general legal information, not legal advice.
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
