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
    <div id={id} className="flex items-end justify-between gap-4 border-b-2 border-[#0F2440] pb-2 mb-6 scroll-mt-28">
      <h2 className="font-headline text-xl md:text-2xl font-extrabold tracking-tight text-[#0F2440]">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#E13131] transition-colors">
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
    <div className="bg-[#0F2440] text-white">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex items-center gap-4 py-2.5 overflow-x-auto no-scrollbar">
        <span className="shrink-0 bg-[#E13131] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em]">Breaking</span>
        {articles.map((a) => (
          <Link key={a.slug} href={articleUrl(a)} className="shrink-0 text-[13px] font-semibold hover:text-[#C8A24A] transition-colors">
            {a.title}
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
      <SectionHeader id="latest" title="Latest news" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <div className="lg:col-span-8 space-y-9">
          <StoryCard article={lead} variant="lead" priority />
          {secondary.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 pt-2 border-t border-slate-100">
              {secondary.map((a) => (
                <StoryCard key={a.slug} article={a} />
              ))}
            </div>
          )}
        </div>
        {rail.length > 0 && (
          <aside className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-8 space-y-6">
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
    <div>
      <SectionHeader id="trending" title="Trending stories" />
      <ol className="space-y-5">
        {articles.map((a, i) => (
          <li key={a.slug} className="flex gap-4">
            <span className="font-headline text-3xl font-extrabold leading-none text-[#C8A24A] w-7 shrink-0">{i + 1}</span>
            <Link href={articleUrl(a)} className="group min-w-0">
              {a.category?.name && <span className="kicker mb-1">{a.category.name}</span>}
              <span className="block font-headline text-[15px] font-bold leading-snug text-slate-900 group-hover:text-news-600 transition-colors">
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
    <div>
      <SectionHeader title={title} href={href} />
      <StoryCard article={lead} />
      {rest.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-5">
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
    <section className="py-8 border-t border-slate-200">
      <SectionHeader title={title} href={href} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-8">
        {people.map((p) => (
          <div key={p.slug}>
            <PersonCard person={p} />
            {counts?.get(p.slug) ? (
              <p className="mt-1 text-[12px] text-slate-400 font-medium">
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
