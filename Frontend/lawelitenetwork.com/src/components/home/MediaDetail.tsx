import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { FollowButton } from '@/components/member/FollowButton';
import { MediaCard } from '@/components/home/HomeSections';
import { StoryCard } from '@/components/knowledge/news/StoryCard';
import { embedUrl } from '@/lib/media-url';
import { formatArticleDate } from '@/lib/format-date';
import type { MediaEntry } from '@/lib/media-server';

export function MediaDetail({ item, more, articles }: { item: MediaEntry; more: MediaEntry[]; articles: any[] }) {
  const embed = embedUrl(item.url);
  const label = item.kind === 'video' ? 'Video' : 'Interview';
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto px-4 sm:px-6 max-w-5xl py-10">
        <span className="kicker">{label}</span>
        <h1 className="mt-2 font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440] leading-[1.05]">{item.title}</h1>
        <p className="mt-3 text-[14px] text-slate-500">
          <Link href={item.subject.href} className="font-bold text-slate-800 hover:text-news-600">{item.subject.name}</Link>
          {item.source ? ` · ${item.source}` : ''}
          {item.publishedAt ? ` · ${formatArticleDate(item.publishedAt)}` : ''}
        </p>

        <div className="mt-8">
          {embed ? (
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={embed}
                title={item.title}
                loading="lazy"
                allow="encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 h-11 px-5 bg-[#0F2440] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#16325a]">
              Watch on {item.source || 'the original site'} <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <FollowButton entityType={item.subject.entityType} slug={item.subject.slug} />
          <span className="text-[12px] text-slate-400">Follow {item.subject.name} for new stories.</span>
        </div>

        {articles.length > 0 && (
          <section className="mt-14">
            <h2 className="font-headline text-xl font-extrabold text-[#0F2440] border-b-2 border-[#0F2440] pb-2 mb-6">Related stories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-9">
              {articles.map((a) => <StoryCard key={a.slug} article={a} />)}
            </div>
          </section>
        )}
        {more.length > 0 && (
          <section className="mt-14">
            <h2 className="font-headline text-xl font-extrabold text-[#0F2440] border-b-2 border-[#0F2440] pb-2 mb-6">More on {item.subject.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {more.map((m) => <MediaCard key={m.url} item={m} />)}
            </div>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
