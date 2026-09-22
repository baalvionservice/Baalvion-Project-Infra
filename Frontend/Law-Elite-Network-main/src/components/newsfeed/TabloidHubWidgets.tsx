import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveArticleImage } from '@/lib/article-art';
import { articleUrl } from '@/lib/article-url';

/**
 * Shared tabloid-style presentational pieces used to build a category hub
 * (see /entertainment) -- kept in one place so a second hub (e.g. /sports)
 * gets the same look/behavior instead of a hand-copied, drifting duplicate.
 * Purely presentational: every article/view-count value rendered here comes
 * from the caller's real data, nothing is fabricated in this file.
 */

export const YELLOW = '#FFCF00';
const HEAD = 'font-headline font-extrabold tracking-[-0.05em] leading-[1.02] text-black';

export function dek(a: any): string {
  return String(a?.summary || a?.excerpt || '').trim();
}

export function dateVal(a: any): number {
  return +new Date(a?.publishedAt || a?.updatedAt || 0) || 0;
}

export function Photo({ a, sizes, priority }: { a: any; sizes: string; priority?: boolean }) {
  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden bg-neutral-200">
      <Image src={resolveArticleImage(a)} alt={a.title} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}

/** Bold headline over a photo, as on a tabloid's big leads. */
export function BigHeadline({ a, size }: { a: any; size: string }) {
  return (
    <h3 className={`${HEAD} ${size}`}>
      <Link href={articleUrl(a)} className="hover:underline decoration-[3px] underline-offset-4">
        {a.title}
      </Link>
    </h3>
  );
}

export function SideStory({ a, last }: { a: any; last: boolean }) {
  return (
    <article className={last ? '' : 'pb-5 mb-5 border-b border-neutral-800'}>
      <Link href={articleUrl(a)} className="block">
        <Photo a={a} sizes="(min-width:1024px) 250px, 100vw" />
      </Link>
      <h4 className="font-headline font-extrabold tracking-[-0.04em] leading-[1.05] text-black text-[17px] mt-3">
        <Link href={articleUrl(a)} className="hover:underline">{a.title}</Link>
      </h4>
    </article>
  );
}

export function SectionBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-0 my-9">
      <span className="h-[3px] flex-1 bg-black" />
      <span
        className="relative mx-0 px-7 py-1.5 bg-black text-[34px] leading-none font-headline font-black italic uppercase tracking-[-0.03em]"
        style={{ color: YELLOW, transform: 'skewX(-8deg)', boxShadow: '-4px 4px 0 0 #000, inset 0 0 0 3px #000, inset 0 0 0 4px ' + YELLOW }}
      >
        <span style={{ display: 'inline-block', transform: 'skewX(8deg)' }}>{label}</span>
      </span>
      <span className="h-[3px] flex-1 bg-black" />
    </div>
  );
}

/** The big story: headline, photo, then a small italic caption line underneath — the dek runs as a photo caption, not bold body copy. */
export function LeadStory({ a, headSize }: { a: any; headSize: string }) {
  return (
    <div>
      <BigHeadline a={a} size={headSize} />
      <Link href={articleUrl(a)} className="block mt-4">
        <Photo a={a} sizes="(min-width:1024px) 450px, 100vw" />
      </Link>
      {dek(a) && <p className="mt-2 text-[13px] italic leading-snug text-neutral-500 line-clamp-2">{dek(a)}</p>}
    </div>
  );
}

/**
 * A tabloid-style hub alternates which column carries the lead story from section to
 * section (AWARDS leads right, MOVIES leads left, ...) instead of always
 * running it on the same side -- copying that rhythm rather than a fixed
 * left-lead layout, which is what read as flat/samey.
 *
 * `moreHref` is optional: a hub with real per-category destinations (like
 * /entertainment's /movies, /music, ...) passes one; a hub whose groups are
 * derived (e.g. /sports' subcategories, which have no dedicated route) omits
 * it rather than link to a URL that doesn't exist.
 */
export function Section({
  label,
  articles,
  leadSide,
  moreHref,
}: {
  label: string;
  articles: any[];
  leadSide: 'left' | 'right';
  moreHref?: string;
}) {
  const [lead, ...rest] = articles;
  const side = rest.slice(0, 2);
  const moreLink = moreHref && (
    <div className="mt-5 text-right">
      <Link href={moreHref} className="text-[15px] font-black italic uppercase tracking-tight text-black hover:underline">
        More {label} &rsaquo;
      </Link>
    </div>
  );
  const leadCol = <LeadStory a={lead} headSize="text-[30px] md:text-[34px]" />;
  const sideCol = side.length > 0 && (
    <div className="mt-8 md:mt-0">
      {side.map((a, i) => (
        <SideStory key={a.slug} a={a} last={i === side.length - 1} />
      ))}
    </div>
  );
  const divider = side.length > 0 && <div className="hidden md:block bg-neutral-700" aria-hidden />;
  if (side.length === 0) {
    return (
      <section aria-label={label}>
        <SectionBanner label={label} />
        {leadCol}
        {moreLink}
      </section>
    );
  }
  const cols = leadSide === 'right'
    ? 'md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.82fr)]'
    : 'md:grid-cols-[minmax(0,1.82fr)_1px_minmax(0,1fr)]';
  return (
    <section aria-label={label}>
      <SectionBanner label={label} />
      <div className={`grid gap-x-6 ${cols}`}>
        {leadSide === 'right' ? (
          <>
            {sideCol}
            {divider}
            {leadCol}
          </>
        ) : (
          <>
            {leadCol}
            {divider}
            {sideCol}
          </>
        )}
      </div>
      {moreLink}
    </section>
  );
}

/** Plain "THE LATEST" rule, a flat reverse-chron feed -- unboxed, unlike the category banners above it. */
export function LatestBanner() {
  return (
    <div className="flex items-center gap-5 my-9">
      <span className="h-[4px] flex-1 bg-black" />
      <h2 className="font-headline font-black italic uppercase text-[26px] tracking-tight text-black whitespace-nowrap">
        The Latest
      </h2>
      <span className="h-[4px] flex-1 bg-black" />
    </div>
  );
}

/**
 * The sidebar "Trending Now" widget -- lead item with a
 * photo and a yellow view-count badge, then plain headline+count rows below.
 * Counts are the real `views` already used to rank "Most Read"; an article
 * with no recorded view count is shown without a badge rather than a made-up
 * number.
 */
export function TrendingNow({ articles, siteName }: { articles: any[]; siteName: string }) {
  if (articles.length === 0) return null;
  const [lead, ...rest] = articles;
  return (
    <div>
      <h2 className="inline-block font-headline font-black italic uppercase tracking-[-0.04em] text-[22px] leading-none text-black pb-1.5 border-b-[7px]" style={{ borderColor: YELLOW }}>
        Trending Now
      </h2>
      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-neutral-500">On {siteName}</p>

      <Link href={articleUrl(lead)} className="relative mt-4 block aspect-[16/10] w-full overflow-hidden bg-neutral-200">
        <Image src={resolveArticleImage(lead)} alt={lead.title} fill sizes="300px" className="object-cover" />
        {typeof lead.views === 'number' && lead.views > 0 && (
          <span className="absolute right-2 top-2 rounded-sm px-2 py-0.5 text-[13px] font-black text-black" style={{ background: YELLOW }}>
            {lead.views.toLocaleString()}
          </span>
        )}
      </Link>
      <Link href={articleUrl(lead)} className="mt-3 block font-headline font-extrabold text-[16px] leading-[1.2] text-black hover:underline">
        {lead.title}
      </Link>

      <ul className="mt-4">
        {rest.map((a, i) => (
          <li key={a.slug} className="flex items-start justify-between gap-3 border-t border-neutral-300 py-3">
            <Link href={articleUrl(a)} className="font-headline font-extrabold text-[15px] leading-[1.2] text-black hover:underline">
              {a.title}
            </Link>
            {typeof a.views === 'number' && a.views > 0 && (
              <span className="shrink-0 rounded-sm px-2 py-0.5 text-[13px] font-black text-black" style={{ background: YELLOW }}>
                {a.views.toLocaleString()}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Sidebar "Most Read" widget -- thumbnail + headline rows ranked by real view counts. */
export function MostRead({ articles }: { articles: any[] }) {
  if (articles.length === 0) return null;
  return (
    <div>
      <h2 className="inline-block font-headline font-black italic uppercase tracking-[-0.04em] text-[24px] leading-none text-black pb-1.5 border-b-[7px]" style={{ borderColor: YELLOW }}>
        Most Read
      </h2>
      <ul className="mt-5">
        {articles.map((a, i) => (
          <li key={a.slug} className={`flex gap-3 py-4 ${i ? 'border-t border-neutral-300' : ''}`}>
            <Link href={articleUrl(a)} className="relative block h-[62px] w-[93px] shrink-0 overflow-hidden bg-neutral-200">
              <Image src={resolveArticleImage(a)} alt="" fill sizes="93px" className="object-cover" />
            </Link>
            <Link href={articleUrl(a)} className="block font-headline font-extrabold tracking-[-0.03em] text-[15px] leading-[1.2] text-black line-clamp-3 hover:underline">
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
