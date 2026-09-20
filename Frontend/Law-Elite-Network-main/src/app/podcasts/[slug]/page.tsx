import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { FollowButton } from '@/components/member/FollowButton';
import { getAllPodcasts, getPodcastBySlug } from '@/lib/media-server';
import { formatArticleDate } from '@/lib/format-date';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export function generateStaticParams() {
  return getAllPodcasts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const show = getPodcastBySlug((await params).slug);
  if (!show) return { robots: { index: false } };
  return { title: show.title, description: show.description, alternates: { canonical: `${SITE}/podcasts/${show.slug}` } };
}

export default async function PodcastPage({ params }: { params: Promise<{ slug: string }> }) {
  const show = getPodcastBySlug((await params).slug);
  if (!show) notFound();
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto px-4 sm:px-6 max-w-4xl py-10">
        <Link href="/podcasts" className="kicker">Podcasts</Link>
        <h1 className="mt-2 font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440]">{show.title}</h1>
        {show.host && <p className="mt-2 text-slate-500">with {show.host}</p>}
        <p className="mt-5 text-lg text-slate-600 leading-relaxed">{show.description}</p>
        {show.personSlug && <div className="mt-5"><FollowButton entityType="person" slug={show.personSlug} /></div>}
        <ul className="mt-10 divide-y divide-slate-100 border-t border-slate-100">
          {show.episodes.map((ep) => (
            <li key={ep.url} className="py-5">
              <a href={ep.url} target="_blank" rel="noopener noreferrer nofollow" className="group inline-flex items-start gap-2 font-headline text-lg font-bold text-slate-900 hover:text-news-600">
                {ep.title} <ExternalLink className="w-4 h-4 mt-1.5 shrink-0 text-slate-400" aria-hidden="true" />
              </a>
              {ep.publishedAt && <p className="text-[12px] text-slate-400 mt-0.5">{formatArticleDate(ep.publishedAt)}</p>}
              {ep.description && <p className="mt-1.5 text-[14px] text-slate-500 line-clamp-3">{ep.description}</p>}
            </li>
          ))}
        </ul>
      </main>
      <PublicFooter />
    </div>
  );
}
