import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VideoHubView } from '@/components/videos/VideoHubView';
import { getArticlesForEntity } from '@/lib/entity-articles';
import { getShowPeople, getVideoHub } from '@/lib/videos-hub';

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
    title: show.seoTitle || `${show.name}: video`,
    description: show.seoDescription || show.description || `Watch ${show.name} on Law Elite Network.`,
    alternates: { canonical: `${SITE}/videos/shows/${show.slug}` },
    // No thin pages: a show is indexed once it has videos or a finished write-up.
    robots: { index: show.indexable || hub.videos.some((v) => v.showSlug === show.slug), follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [hub, people, news] = await Promise.all([getVideoHub(), getShowPeople(slug), getArticlesForEntity('video-show', slug).catch(() => [])]);
  const show = hub.shows.find((s) => s.slug === slug);
  if (!show) notFound();
  const ld = show.overview ? {
    '@context': 'https://schema.org', '@type': 'TVSeries', name: show.name, url: `${SITE}/videos/shows/${show.slug}`, description: show.description || undefined,
    ...(show.seasons.length ? { numberOfSeasons: show.seasons.length } : {}), ...(show.countryCode ? { countryOfOrigin: { '@type': 'Country', name: show.countryCode } } : {}),
  } : null;
  const faq = show.faq.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: show.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      <VideoHubView hub={hub} show={show} people={people} news={news} />
    </>
  );
}
