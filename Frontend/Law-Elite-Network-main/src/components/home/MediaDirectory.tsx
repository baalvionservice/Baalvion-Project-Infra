import React from 'react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { MediaCard } from '@/components/home/HomeSections';
import type { MediaEntry, MediaKind } from '@/lib/media-server';

const COPY: Record<MediaKind, { title: string; lede: string; empty: string }> = {
  video: {
    title: 'Videos',
    lede: 'Clips attached to the people, films, shows and music we profile.',
    empty: 'No videos have been added to any profile yet. They appear here as soon as one is.',
  },
  interview: {
    title: 'Interviews',
    lede: 'Interviews with the people and productions we profile, linked to the original publisher.',
    empty: 'No interviews have been added to any profile yet. They appear here as soon as one is.',
  },
};

export function MediaDirectory({ kind, items }: { kind: MediaKind; items: MediaEntry[] }) {
  const copy = COPY[kind];
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto px-4 sm:px-6 max-w-7xl py-10">
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440]">{copy.title}</h1>
        <p className="mt-3 text-slate-500 max-w-2xl">{copy.lede}</p>
        {items.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {items.map((m) => (
              <MediaCard key={m.url} item={m} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-slate-200 p-8 text-slate-500">{copy.empty}</p>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
