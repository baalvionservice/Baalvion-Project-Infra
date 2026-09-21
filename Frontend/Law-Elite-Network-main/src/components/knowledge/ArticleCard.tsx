"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import { resolveArticleImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';

interface ArticleCardProps {
  article: any;
}

function Byline({ article }: { article: any }) {
  const author = article?.author || 'Page Six Editorial';
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-semibold text-slate-500 uppercase tracking-wider">
      <span className="text-[#E13131] font-bold">By {author}</span>
    </div>
  );
}

/**
 * Editorial article card used on category and search result grids.
 * Styled in high-impact Page Six / NY Post tabloid media layout.
 */
export function ArticleCard({ article }: ArticleCardProps) {
  if (!article) return null;
  const categoryName = article?.category?.name || article?.subcategory?.name || 'NEWS';

  return (
    <Link href={articleUrl(article)} className="group flex flex-col h-full border border-slate-200 hover:border-[#E13131] hover:shadow-md transition-all p-3.5 bg-white rounded-sm">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-slate-900">
        <Image
          src={resolveArticleImage(article)}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-[#E13131] text-white text-[9.5px] font-black uppercase tracking-[0.16em] px-2 py-0.5 rounded-xs shadow-sm">
            {categoryName}
          </span>
        </div>
      </div>

      <div className="pt-3.5 flex flex-col flex-1">
        <h3 className="font-serif text-lg md:text-[1.25rem] font-bold leading-snug text-slate-900 group-hover:text-[#E13131] transition-colors line-clamp-3">
          {article.title}
        </h3>

        {article.summary && (
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 font-serif line-clamp-2 flex-1">
            {article.summary}
          </p>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <Byline article={article} />
          {article.views ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-xs">
              <Eye className="w-3 h-3 text-[#E13131]" /> {Number(article.views).toLocaleString()}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
