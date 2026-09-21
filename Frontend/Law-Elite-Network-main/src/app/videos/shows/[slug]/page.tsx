import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VideoHubView } from '@/components/videos/VideoHubView';
import { getVideoHub } from '@/lib/videos-hub';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getVideoHub()).shows.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const hub = await getVideoHub();
  const { slug } = await params;
  const show = hub.shows.find((s) => s.slug === slug);
  if (!show) return { robots: { index: false } };
  return {
    title: `${show.name}: video`,
    description: show.description || `Watch ${show.name} on Law Elite Network.`,
    alternates: { canonical: `${SITE}/videos/shows/${show.slug}` },
    robots: { index: hub.videos.some((v) => v.showSlug === show.slug), follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const hub = await getVideoHub();
  const { slug } = await params;
  const show = hub.shows.find((s) => s.slug === slug);
  if (!show) notFound();
  return <VideoHubView hub={hub} show={show} />;
}
