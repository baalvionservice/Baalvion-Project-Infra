import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MediaDetail } from '@/components/home/MediaDetail';
import { getAllMedia, getMediaBySlug } from '@/lib/media-server';
import { getArticlesForEntity } from '@/lib/entity-articles';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 3600;
// Unknown slugs 404 instead of rendering an empty shell.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getAllMedia('video')).map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = await getMediaBySlug('video', (await params).slug);
  if (!item) return { robots: { index: false } };
  return {
    title: item.title,
    description: `${item.title}: video featuring ${item.subject.name}.`,
    alternates: { canonical: `${SITE}/videos/${item.slug}` },
    openGraph: { type: 'video.other', title: item.title, images: item.thumbnailUrl ? [item.thumbnailUrl] : undefined },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const item = await getMediaBySlug('video', (await params).slug);
  if (!item) notFound();
  const [all, articles] = await Promise.all([
    getAllMedia('video'),
    getArticlesForEntity(item.subject.entityType, item.subject.slug),
  ]);
  const more = all.filter((m) => m.subject.slug === item.subject.slug && m.slug !== item.slug).slice(0, 3);
  return <MediaDetail item={item} more={more} articles={articles.slice(0, 4)} />;
}
