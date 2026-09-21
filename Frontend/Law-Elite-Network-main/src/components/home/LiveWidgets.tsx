import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Camera, Gavel, Play, Radio } from 'lucide-react';
import type { HomeWidgetItem } from '@/lib/home-widgets';

/**
 * Homepage widgets driven by admin-published entries (admin console → Law Elite
 * → Homepage widgets). Each renders nothing when it has no live entries.
 */

const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }) : '';

export function BreakingBar({ items }: { items: HomeWidgetItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-red-700 text-white border-b-2 border-red-900">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-2.5 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
        <span className="shrink-0 self-start bg-black text-white text-xs font-black tracking-widest uppercase px-2.5 py-1 rounded">Breaking</span>
        <ul className="min-w-0 flex-1 space-y-1">
          {items.map((i) => (
            <li key={i.id} className="text-sm sm:text-base leading-snug">
              {i.url ? <a href={i.url} {...external} className="font-bold hover:underline">{i.title}</a> : <span className="font-bold">{i.title}</span>}
              <span className="block sm:inline sm:ml-2 text-[12px] text-red-100">
                {[i.source_name, when(i.event_at)].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function TickerBar({ items }: { items: HomeWidgetItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-slate-950 text-white text-[11px] border-b border-slate-800 uppercase tracking-wider overflow-x-auto no-scrollbar">
      <ul className="container mx-auto px-4 sm:px-6 max-w-7xl flex items-center gap-6 py-1.5 min-w-max">
        {items.map((i) => {
          const body = (
            <>
              <span className="text-slate-400 font-bold">{i.title}</span>{' '}
              <span className="font-black text-white">{i.value}</span>
            </>
          );
          return <li key={i.id}>{i.url ? <a href={i.url} {...external} className="hover:text-[#E13131]">{body}</a> : body}</li>;
        })}
      </ul>
    </div>
  );
}

export function AudioBriefing({ items }: { items: HomeWidgetItem[] }) {
  const item = items.find((i) => i.url);
  if (!item) return null;
  return (
    <section aria-label="Audio briefing" className="bg-slate-900 border-2 border-[#E13131] text-white p-4 rounded-sm shadow-lg my-6">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#E13131]"><Radio className="w-3 h-3" aria-hidden="true" /> Audio briefing</div>
      <h3 className="font-serif text-base sm:text-lg font-bold mt-1 leading-snug">{item.title}</h3>
      {item.summary && <p className="text-sm text-slate-300 mt-1">{item.summary}</p>}
      <audio controls preload="none" src={item.url!} className="w-full mt-3" />
      {item.source_name && <p className="mt-2 text-[11px] text-slate-400">{item.source_name}</p>}
    </section>
  );
}

export function DocketRail({ items }: { items: HomeWidgetItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="py-8 my-6 bg-slate-950 border-y-4 border-[#E13131] text-white px-4 sm:px-8 rounded-sm">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
        <span className="bg-[#E13131] p-2 rounded-sm"><Gavel className="w-5 h-5" aria-hidden="true" /></span>
        <h2 className="font-serif text-xl md:text-3xl font-black uppercase tracking-tight">Cases we&rsquo;re following</h2>
        <Link href="/legal/cases" className="ml-auto text-[11px] font-black uppercase tracking-wider bg-[#E13131] hover:bg-red-700 px-3 py-2.5 sm:py-2 rounded-sm">All cases</Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {items.map((i) => (
          <article key={i.id} className="bg-slate-900 border border-slate-800 p-5 rounded-sm flex flex-col">
            <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="bg-[#E13131] px-2 py-0.5 rounded-sm">{i.extra?.status}</span>
              {i.extra?.next_hearing && <span className="text-slate-400 normal-case tracking-normal font-bold">Next: {i.extra.next_hearing}</span>}
            </div>
            <h3 className="font-serif text-lg font-black mt-3 leading-snug">{i.title}</h3>
            <p className="text-[12px] font-semibold text-slate-400 mt-1">{i.extra?.court}</p>
            {i.summary && <p className="text-[13px] text-slate-300 font-serif leading-relaxed mt-3">{i.summary}</p>}
            <a href={i.url!} {...external} className="mt-auto pt-4 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#E13131] hover:text-white">
              {i.source_name || 'Docket'} <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PhotoRail({ items }: { items: HomeWidgetItem[] }) {
  const photos = items.filter((i) => i.image_url);
  if (photos.length === 0) return null;
  return (
    <section className="py-8 my-6 border border-slate-200 rounded-sm p-4 sm:p-6 bg-white">
      <div className="flex items-center gap-3 border-b-4 border-[#E13131] pb-3 mb-6">
        <span className="bg-[#E13131] text-white p-2 rounded-sm"><Camera className="w-5 h-5" aria-hidden="true" /></span>
        <h2 className="font-serif text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900">Photos</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {photos.map((p) => (
          <figure key={p.id} className="border border-slate-200 rounded-sm p-3 bg-slate-50">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-slate-200">
              <Image src={p.image_url!} alt={p.title} fill unoptimized sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
            </div>
            <figcaption className="mt-3">
              <span className="block font-serif text-base font-bold text-slate-900 leading-snug">{p.title}</span>
              {p.summary && <span className="block mt-1 text-[12px] text-slate-600">{p.summary}</span>}
              <span className="block mt-2 text-[11px] font-semibold text-slate-500">
                {p.url ? <a href={p.url} {...external} className="hover:underline">Photo: {p.credit}</a> : <>Photo: {p.credit}</>}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function ShortsRail({ items }: { items: HomeWidgetItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="py-8 my-6 bg-slate-950 text-white rounded-2xl p-4 sm:p-6 border border-slate-800">
      <h2 className="text-xl sm:text-2xl font-black font-serif mb-5 pb-3 border-b border-slate-800">Video</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((v) => (
          <a key={v.id} href={v.url!} {...external} className="group relative block h-[260px] sm:h-[320px] rounded-xl overflow-hidden border border-slate-800 hover:border-red-500/80 bg-slate-900">
            {v.image_url && <Image src={v.image_url} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 25vw" className="object-cover opacity-75 group-hover:scale-105 transition duration-500" />}
            <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <span className="absolute inset-0 flex items-center justify-center"><span className="w-14 h-14 rounded-full bg-black/60 group-hover:bg-red-600 flex items-center justify-center"><Play className="w-5 h-5 fill-white" aria-hidden="true" /></span></span>
            <span className="absolute bottom-0 p-4">
              <span className="block font-bold text-sm leading-snug line-clamp-3">{v.title}</span>
              {v.source_name && <span className="block mt-1 text-[11px] text-slate-400">{v.source_name}</span>}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
