'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveArticleImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';
import { formatArticleDate } from '@/lib/format-date';

function dek(a: any): string {
  return String(a?.summary || a?.excerpt || '').trim();
}

/**
 * "Month Day, Year | h:mma" tabloid-style latest-post timestamps -- only
 * when the source value is a real ISO timestamp (CMS articles). Bundled/seed
 * data carries a hand-authored date with no time-of-day, so it renders as a
 * date only rather than fabricating a clock time that was never recorded.
 */
function latestTimestamp(a: any): string {
  const raw = a?.publishedAt || a?.updatedAt;
  if (!raw || typeof raw !== 'string') return '';
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return formatArticleDate(raw) || '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).toLowerCase().replace(' ', '');
  return `${datePart} | ${timePart}`;
}

function LatestRow({ a, last }: { a: any; last: boolean }) {
  const ts = latestTimestamp(a);
  return (
    <article className={`flex gap-5 sm:gap-6 py-6 ${last ? '' : 'border-b border-neutral-300'}`}>
      <Link href={articleUrl(a)} className="relative block w-[140px] sm:w-[220px] shrink-0 aspect-[3/2] overflow-hidden bg-neutral-200">
        <Image src={resolveArticleImage(a)} alt={a.title} fill sizes="220px" className="object-cover" />
      </Link>
      <div className="min-w-0">
        <h3 className="font-headline font-extrabold text-[19px] sm:text-[23px] leading-[1.1] tracking-[-0.02em] text-black">
          <Link href={articleUrl(a)} className="hover:underline">{a.title}</Link>
        </h3>
        {ts && <p className="mt-1.5 text-[13px] text-neutral-500">{ts}</p>}
        {dek(a) && <p className="mt-1.5 text-[15px] text-neutral-600 leading-snug line-clamp-2">{dek(a)}</p>}
      </div>
    </article>
  );
}

const PAGE_SIZE = 4;

/**
 * Reveals the already-fetched "Latest" pool a page at a time instead of
 * dumping the whole list at once -- same real articles, no re-fetch, just
 * paced the way a fast-moving tabloid feed does. True infinite scroll: an
 * IntersectionObserver on the sentinel below the visible rows reveals the
 * next page automatically once it nears the viewport, rather than requiring
 * a click -- a manual "See More Stories" button never fires just from
 * scrolling, which read as "the rest of the list is missing."
 */
export function LatestStoriesFeed({ articles }: { articles: any[] }) {
  const [count, setCount] = useState(Math.min(PAGE_SIZE, articles.length));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const shown = articles.slice(0, count);
  const hasMore = count < articles.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + PAGE_SIZE, articles.length));
        }
      },
      { rootMargin: '600px' }, // start loading well before the sentinel is actually on screen
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, articles.length]);

  return (
    <div>
      {shown.map((a, i) => (
        <LatestRow key={a.slug} a={a} last={i === shown.length - 1 && !hasMore} />
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center border-t border-neutral-300 pt-8 text-[13px] font-bold uppercase tracking-wider text-neutral-400">
          Loading more stories…
        </div>
      )}
    </div>
  );
}
