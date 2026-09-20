import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getAllGalleries } from '@/lib/media-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const galleries = await getAllGalleries();
  return {
    title: 'Photo galleries',
    description: 'Photo galleries of the people and events covered by Law Elite Network.',
    alternates: { canonical: `${SITE}/galleries` },
    robots: { index: galleries.length > 0, follow: true },
  };
}

export default async function GalleriesPage() {
  const galleries = await getAllGalleries();
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto px-4 sm:px-6 max-w-7xl py-10">
        <h1 className="font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440]">Photo galleries</h1>
        <p className="mt-3 text-slate-500 max-w-2xl">Photos we have the right to show, each credited to its source.</p>
        {galleries.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {galleries.map((g) => (
              <Link key={g.slug} href={`/galleries/${g.slug}`} className="group">
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <Image src={g.photos[0].url} alt={g.photos[0].title} fill sizes="25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <h2 className="mt-3 font-headline text-lg font-bold text-slate-900 group-hover:text-news-600">{g.title}</h2>
                <p className="text-[13px] text-slate-500">{g.photos.length} {g.photos.length === 1 ? 'photo' : 'photos'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-slate-200 p-8 text-slate-500">No galleries yet. They appear here once profiles have photos attached.</p>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
