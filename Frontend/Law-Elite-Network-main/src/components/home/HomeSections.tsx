import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play } from 'lucide-react';
import { StoryCard } from '@/components/knowledge/news/StoryCard';
import { PersonCard } from '@/components/people/PersonCard';
import { articleUrl } from '@/lib/article-url';
import { topicUrl } from '@/lib/topic-url';
import { PRIMARY_NAV } from '@/lib/site-nav';
import { mediaUrl } from '@/lib/media-url';
import { formatArticleDate as formatDate } from '@/lib/format-date';
import type { MediaEntry } from '@/lib/media-server';
import type { HomeFeed } from '@/lib/home-feed';
import type { Person } from '@/types/person';

type Article = any;

export function SectionHeader({ title, href, id }: { title: string; href?: string; id?: string }) {
  return (
    <div id={id} className="flex items-center justify-between gap-4 border-b-4 border-[#E13131] pb-2.5 mb-6 scroll-mt-28">
      <div className="flex items-center gap-2.5">
        <span className="w-3.5 h-7 bg-[#E13131] inline-block" />
        <h2 className="font-serif text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider text-[#E13131] hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-2.5 sm:py-1 rounded-sm">
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Only rendered when something was published in the last 24h — see getHomeFeed. */
export function BreakingStrip({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <div className="bg-[#111111] text-white border-b-2 border-[#E13131] shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex items-center gap-4 py-2.5 overflow-x-auto no-scrollbar">
        <span className="shrink-0 bg-[#E13131] text-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] rounded-sm animate-pulse shadow-sm">
          LAW ELITE BREAKING
        </span>
        {articles.map((a) => (
          <Link key={a.slug} href={articleUrl(a)} className="shrink-0 text-[13.5px] font-bold hover:text-[#E13131] transition-colors flex items-center gap-2">
            <span className="text-[#E13131]">▶</span> {a.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function FrontPage({ articles }: { articles: Article[] }) {
  const [lead, ...rest] = articles;
  if (!lead) return null;
  const secondary = rest.slice(0, 2);
  const rail = rest.slice(2, 7);
  return (
    <section className="py-8 md:py-10">
      <SectionHeader id="latest" title="Top Stories" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div className="lg:col-span-8 space-y-9">
          <StoryCard article={lead} variant="lead" priority />
          {secondary.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 pt-4">
              {secondary.map((a) => (
                <StoryCard key={a.slug} article={a} />
              ))}
            </div>
          )}
        </div>
        {rail.length > 0 && (
          <aside className="lg:col-span-4 bg-slate-50/80 border-2 border-slate-900 p-5 rounded-sm shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#E13131] pb-2 mb-4">
              <h3 className="font-serif text-lg font-black uppercase tracking-tight text-slate-900">HOT NEWS RAIL</h3>
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#E13131] text-white px-2 py-0.5">EXCLUSIVES</span>
            </div>
            {rail.map((a) => (
              <StoryCard key={a.slug} article={a} variant="horizontal" />
            ))}
          </aside>
        )}
      </div>
    </section>
  );
}

export function TrendingList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <div className="bg-slate-900 text-white p-6 rounded-sm border-t-4 border-[#E13131] shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
        <h2 className="font-serif text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <span className="w-2.5 h-6 bg-[#E13131] inline-block" /> TRENDING STORIES
        </h2>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#E13131] bg-slate-800 px-2 py-1">MOST READ</span>
      </div>
      <ol className="space-y-4">
        {articles.map((a, i) => (
          <li key={a.slug} className="flex gap-4 pb-4 border-b border-slate-800 last:border-0 last:pb-0">
            <span className="font-headline text-3xl font-black leading-none text-[#E13131] w-7 shrink-0">{i + 1}</span>
            <Link href={articleUrl(a)} className="group min-w-0">
              {a.category?.name && (
                <span className="inline-block bg-[#E13131] text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 mb-1 rounded-xs">
                  {a.category.name}
                </span>
              )}
              <span className="block font-serif text-[15px] font-bold leading-snug text-slate-100 group-hover:text-[#E13131] transition-colors">
                {a.title}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** One vertical (Celebrity, Entertainment, Sports, Legal): a lead card and a short list. Renders nothing when empty. */
export function PillarColumn({ title, href, articles }: { title: string; href: string; articles: Article[] }) {
  if (articles.length === 0) return null;
  const [lead, ...rest] = articles;
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-sm hover:border-slate-400 transition-colors shadow-sm">
      <SectionHeader title={title} href={href} />
      {/* Auto-height wrapper: the card is h-full, which would otherwise stretch to the grid row and push `rest` out of the box. */}
      <div>
        <StoryCard article={lead} />
      </div>
      {rest.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
          {rest.map((a) => (
            <StoryCard key={a.slug} article={a} variant="horizontal" />
          ))}
        </div>
      )}
    </div>
  );
}

export function PeopleRail({
  title,
  href,
  people,
  counts,
}: {
  title: string;
  href: string;
  people: Person[];
  counts?: Map<string, number>;
}) {
  if (people.length === 0) return null;
  return (
    <section className="py-8 border-t-2 border-slate-900 my-6">
      <SectionHeader title={title} href={href} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-8">
        {people.map((p) => (
          <div key={p.slug} className="group">
            <PersonCard person={p} />
            {counts?.get(p.slug) ? (
              <p className="mt-1 text-[11px] font-black uppercase tracking-wider text-[#E13131]">
                {counts.get(p.slug)} {counts.get(p.slug) === 1 ? 'story' : 'stories'}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MediaRail({ title, href, items }: { title: string; href: string; items: MediaEntry[] }) {
  if (items.length === 0) return null;
  return (
    <section className="py-8 border-t border-slate-200">
      <SectionHeader title={title} href={href} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((m) => (
          <MediaCard key={m.url} item={m} />
        ))}
      </div>
    </section>
  );
}

export function MediaCard({ item }: { item: MediaEntry }) {
  return (
    <div className="group">
      <Link href={mediaUrl(item.kind, item.slug)} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-[#0F2440]">
          {item.thumbnailUrl && (
            <Image src={item.thumbnailUrl} alt={item.title} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-11 h-11 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" aria-hidden="true" />
            </span>
          </span>
        </div>
        <h3 className="mt-3 font-headline text-[15px] font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors line-clamp-2">
          {item.title}
        </h3>
      </Link>
      <p className="mt-1 text-[12px] text-slate-500">
        <Link href={item.subject.href} className="font-semibold text-slate-700 hover:text-news-600">{item.subject.name}</Link>
        {item.source ? ` · ${item.source}` : ''}
        {item.publishedAt ? ` · ${formatDate(item.publishedAt)}` : ''}
      </p>
    </div>
  );
}

export function PopularTopics({ topics }: { topics: HomeFeed['popularTopics'] }) {
  if (topics.length === 0) return null;
  return (
    <section className="py-8 border-t border-slate-200">
      <SectionHeader title="Popular topics" href="/topics" />
      <div className="flex flex-wrap gap-2.5">
        {topics.map(({ topic, articleCount }) => (
          <Link
            key={topic.slug}
            href={topicUrl(topic.slug)}
            className="inline-flex items-center gap-2 border border-slate-300 px-3.5 py-2 text-[13px] font-bold text-slate-800 hover:border-[#0F2440] hover:bg-[#0F2440] hover:text-white transition-colors"
          >
            {topic.name}
            <span className="text-[11px] font-semibold opacity-60">{articleCount}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Always-on directory band, driven by the same config as the nav so a new section shows up here too. */
export function ExploreBand() {
  return (
    <section className="bg-[#0F2440] text-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8A24A]">Explore Law Elite Network</p>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
          {PRIMARY_NAV.map((s) => (
            <Link key={s.label} href={s.href} className="group bg-[#0F2440] p-5 hover:bg-[#16325a] transition-colors">
              <span className="flex items-center justify-between font-headline text-lg font-extrabold">
                {s.label}
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </span>
              {s.children && (
                <span className="mt-1.5 block text-[12px] text-white/55 leading-snug line-clamp-2">
                  {s.children.slice(0, 3).map((c) => c.label).join(' · ')}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
