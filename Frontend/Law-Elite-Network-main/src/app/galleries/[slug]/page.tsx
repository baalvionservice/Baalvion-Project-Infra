import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { getAllGalleries, getGalleryBySlug } from '@/lib/media-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getAllGalleries()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = await getGalleryBySlug((await params).slug);
  if (!g) return { robots: { index: false } };
  return { title: g.title, description: g.description || `${g.title}, ${g.photos.length} photos.`, alternates: { canonical: `${SITE}/galleries/${g.slug}` } };
}

export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const g = await getGalleryBySlug((await params).slug);
  if (!g) notFound();
  return (
    <div className="min-h-screen bg-white pt-[60px] lg:pt-[100px]">
      <main className="container mx-auto px-4 sm:px-6 max-w-7xl py-10">
        <Link href="/galleries" className="kicker">Photo galleries</Link>
        <h1 className="mt-2 font-headline text-3xl md:text-5xl font-extrabold tracking-[-0.02em] text-[#0F2440]">{g.title}</h1>
        {g.subject && (
          <p className="mt-2 text-slate-500">
            <Link href={g.subject.href} className="font-bold text-slate-800 hover:text-news-600">{g.subject.name}</Link>
          </p>
        )}
        {g.description && <p className="mt-4 text-slate-600 max-w-2xl">{g.description}</p>}
        <div className="mt-10 columns-1 sm:columns-2 lg:columns-3 gap-5 [&>figure]:mb-5">
          {g.photos.map((ph) => (
            <figure key={ph.url} className="break-inside-avoid">
              <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                <Image src={ph.url} alt={ph.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              </div>
              <figcaption className="mt-2 text-[12px] text-slate-500">
                {ph.title}{ph.source ? ` · Photo: ${ph.source}` : ''}
              </figcaption>
            </figure>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
