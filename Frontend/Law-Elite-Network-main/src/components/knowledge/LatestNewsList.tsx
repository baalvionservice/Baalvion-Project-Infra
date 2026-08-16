import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, ArrowUpRight, ArrowRight } from 'lucide-react';
import { articleUrl } from '@/lib/article-url';
import { resolveArticleImage } from '@/lib/article-art';

/**
 * Investopedia's "Latest Podcast Episodes" slot, filled with the network's
 * real legal-news feed -- a thumbnail-led first item plus a short text list,
 * same shape as the reference design. Supersedes the old standalone
 * NewsGateway teaser at the bottom of the page rather than duplicating it.
 */
export function LatestNewsList({ news }: { news: any[] }) {
  if (!news || news.length === 0) return null;
  const [first, ...rest] = news.slice(0, 4);

  return (
    <div className="rounded-xl border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-4 h-4 text-news-600" aria-hidden="true" />
        <span className="kicker">Newsroom</span>
      </div>
      <h2 className="font-headline text-lg font-extrabold text-slate-900 mb-4">Latest Legal News</h2>
      <div className="space-y-4 flex-1">
        {first && (
          <Link href={articleUrl(first)} className="group flex gap-3">
            <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
              <Image
                src={resolveArticleImage(first)}
                alt={first.title}
                fill
                sizes="64px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="min-w-0">
              {first.category?.name && (
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-news-600 mb-1">
                  {first.category.name}
                </span>
              )}
              <h3 className="font-headline text-[14px] font-bold text-slate-900 group-hover:text-news-600 transition-colors leading-snug line-clamp-2">
                {first.title}
              </h3>
            </div>
          </Link>
        )}
        {rest.length > 0 && (
          <ul className="space-y-3 pt-1 border-t border-slate-100">
            {rest.map((n) => (
              <li key={n.id || n.slug}>
                <Link href={articleUrl(n)} className="group flex items-start gap-2">
                  <ArrowUpRight
                    className="w-3.5 h-3.5 text-slate-300 group-hover:text-news-600 mt-0.5 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                  <span className="text-[13px] font-semibold text-slate-700 group-hover:text-news-600 transition-colors leading-snug line-clamp-2">
                    {n.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        href="/news"
        className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-blue-700 hover:text-news-600 transition-colors"
      >
        Visit Legal News <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
