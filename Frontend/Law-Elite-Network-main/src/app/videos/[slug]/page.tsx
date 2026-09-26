import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MediaDetail } from '@/components/home/MediaDetail';
import { getAllMedia, getMediaBySlug } from '@/lib/media-server';
import { getArticlesForEntity } from '@/lib/entity-articles';
import { VideoWatch } from '@/components/videos/VideoWatch';
import { getVideoHub } from '@/lib/videos-hub';
import { embedUrl } from '@/lib/media-url';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 3600;
// Unknown slugs 404 instead of rendering an empty shell.
export const dynamicParams = true;

export async function generateStaticParams() {
  const [hub, attached] = await Promise.all([getVideoHub(), getAllMedia('video')]);
  return [...hub.videos, ...attached].map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const managed = (await getVideoHub()).videos.find((v) => v.slug === slug);
  if (managed) {
    return {
      title: managed.title,
      description: managed.description || `${managed.title}: video on Law Elite Network.`,
      alternates: { canonical: `${SITE}/videos/${managed.slug}` },
      openGraph: { type: 'video.other', title: managed.title, images: managed.thumbnailUrl ? [managed.thumbnailUrl] : undefined },
    };
  }
  const item = await getMediaBySlug('video', slug);
  if (!item) return { robots: { index: false } };
  return {
    title: item.title,
    description: `${item.title}: video featuring ${item.subject.name}.`,
    alternates: { canonical: `${SITE}/videos/${item.slug}` },
    openGraph: { type: 'video.other', title: item.title, images: item.thumbnailUrl ? [item.thumbnailUrl] : undefined },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const hub = await getVideoHub();
  const managed = hub.videos.find((v) => v.slug === slug);
  if (managed) {
    const show = hub.shows.find((x) => x.slug === managed.showSlug);
    const related = hub.videos.filter((v) => v.slug !== managed.slug);
    const same = managed.showSlug ? related.filter((v) => v.showSlug === managed.showSlug) : [];
    const iso = (sec?: number) => (sec ? `PT${Math.floor(sec / 60)}M${sec % 60}S` : undefined);
    const ld = {
      '@context': 'https://schema.org', '@type': 'VideoObject', name: managed.title,
      description: managed.description || `${managed.title}${show ? `, from ${show.name}` : ''}.`,
      ...(managed.thumbnailUrl ? { thumbnailUrl: [managed.thumbnailUrl] } : {}), ...(managed.publishedAt ? { uploadDate: managed.publishedAt } : {}),
      ...(iso(managed.durationSeconds) ? { duration: iso(managed.durationSeconds) } : {}), ...(embedUrl(managed.url) ? { embedUrl: embedUrl(managed.url) } : {}),
      contentUrl: managed.url, ...(managed.source ? { publisher: { '@type': 'Organization', name: managed.source } } : {}),
    };
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <VideoWatch video={managed} show={show} more={(same.length ? same : related).slice(0, 6)} />
      </>
    );
  }
  const item = await getMediaBySlug('video', slug);
  if (!item) notFound();
  const [all, articles] = await Promise.all([
    getAllMedia('video'),
    getArticlesForEntity(item.subject.entityType, item.subject.slug),
  ]);
  const more = all.filter((m) => m.subject.slug === item.subject.slug && m.slug !== item.slug).slice(0, 3);
  return <MediaDetail item={item} more={more} articles={articles.slice(0, 4)} />;
}
