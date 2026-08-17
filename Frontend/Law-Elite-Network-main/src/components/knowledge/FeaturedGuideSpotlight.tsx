import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { articleUrl } from '@/lib/article-url';
import { resolvePersonImage } from '@/lib/article-art';

/**
 * Investopedia's "Making Sense of Modern Crypto" explainer box -- a single
 * editorially-featured guide instead. The reference design shows a collage
 * of four people; we only have one real byline per guide, so this shows that
 * guide's actual author (real portrait/silhouette, never a stock photo)
 * rather than inventing three more faces.
 */
export function FeaturedGuideSpotlight({ article, author }: { article: any; author: any }) {
  if (!article) return null;
  const href = articleUrl(article);

  return (
    <div className="rounded-xl border border-slate-200 p-6 h-full flex flex-col bg-slate-50/50">
      <span className="kicker mb-3">Editor&rsquo;s Pick</span>
      {author && (
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-2 ring-white shadow-sm">
            <Image src={resolvePersonImage(author)} alt={author.name} fill className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate">{author.name}</p>
            <p className="text-[11.5px] text-slate-500 truncate">{author.title}</p>
          </div>
        </div>
      )}
      <h2 className="font-headline text-xl font-extrabold text-slate-900 leading-tight mb-2">
        <Link href={href} className="hover:text-news-600 transition-colors">
          {article.title}
        </Link>
      </h2>
      {article.summary && (
        <p className="text-[13px] text-slate-600 leading-relaxed mb-5 flex-1 line-clamp-4">{article.summary}</p>
      )}
      <Link
        href={href}
        className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-md bg-[#0B1F3A] text-white text-[12px] font-bold uppercase tracking-wide hover:bg-blue-800 transition-colors w-fit"
      >
        Read More <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
