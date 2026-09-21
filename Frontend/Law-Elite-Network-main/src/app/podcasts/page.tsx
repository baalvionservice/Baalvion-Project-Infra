import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getAllPodcasts } from '@/lib/media-server';
import { PodcastDirectory } from '@/components/podcasts/PodcastDirectory';
import { getPodcastHub } from '@/lib/podcasts-hub';
import { fetchEntityPhotos } from '@/lib/photos-api';

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export async function generateMetadata(): Promise<Metadata> {
  const hub = await getPodcastHub();
  return {
    title: 'Podcasts',
    description: 'Podcasts on people, entertainment, sports and the law, listed by Law Elite Network.',
    alternates: { canonical: `${SITE}/podcasts` },
    // No thin pages: unindexed until at least one show is listed.
    robots: { index: hub.length + getAllPodcasts().length > 0, follow: true },
  };
}

export default async function PodcastsPage() {
  const [hub, photos] = await Promise.all([getPodcastHub(), fetchEntityPhotos()]);
  if (hub.length > 0) return <PodcastDirectory shows={hub.map((h) => ({ ...h, photo: photos.get(`podcast:${h.slug}`) }))} />;
  const shows = getAllPodcasts();
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto px-4 sm:px-6 max-w-7xl py-10">
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440]">Podcasts</h1>
        <p className="mt-3 text-slate-500 max-w-2xl">Shows we list, with links to each episode on its own platform.</p>
        {shows.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {shows.map((p) => (
              <Link key={p.slug} href={`/podcasts/${p.slug}`} className="group">
                <div className="relative aspect-square bg-[#0F2440] overflow-hidden">
                  {p.coverUrl && <Image src={p.coverUrl} alt={p.title} fill sizes="25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
                </div>
                <h2 className="mt-3 font-headline text-lg font-bold text-slate-900 group-hover:text-news-600">{p.title}</h2>
                {p.host && <p className="text-[13px] text-slate-500">with {p.host}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-slate-200 p-8 text-slate-500">No podcasts are listed yet. They appear here as soon as one is added.</p>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
