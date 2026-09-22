import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeasonView } from '@/components/videos/SeasonView';
import { getShowPeople, getVideoHub, seasonUrl } from '@/lib/videos-hub';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getVideoHub()).shows.flatMap((s) => s.seasons.map((x) => ({ slug: s.slug, n: String(x.number) })));
}

async function load(slug: string, n: string) {
  const hub = await getVideoHub();
  const show = hub.shows.find((s) => s.slug === slug);
  const season = show?.seasons.find((x) => String(x.number) === n);
  return { hub, show, season };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; n: string }> }): Promise<Metadata> {
  const { slug, n } = await params;
  const { show, season } = await load(slug, n);
  if (!show || !season) return { robots: { index: false } };
  const title = `${show.name} ${season.number}${season.year ? ` (${season.year})` : ''}: ${season.winner ? 'winner, ' : ''}housemates and highlights`;
  const description = [
    season.winner ? `${season.winner} won ${show.name} season ${season.number}${season.runnerUp ? `, with ${season.runnerUp} as runner-up` : ''}.` : `${show.name} season ${season.number}${season.year ? `, ${season.year}` : ''}.`,
    season.host ? `Hosted by ${season.host}.` : '', season.participants.length ? `See all ${season.participants.length} housemates.` : '',
  ].filter(Boolean).join(' ');
  return {
    title, description, alternates: { canonical: `${SITE}${seasonUrl(show.slug, season.number)}` },
    // No thin pages: a season page needs a real housemate list.
    robots: { index: season.participants.length >= 8, follow: true },
    openGraph: { type: 'website', title, description },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string; n: string }> }) {
  const { slug, n } = await params;
  const { hub, show, season } = await load(slug, n);
  if (!show || !season) notFound();
  const people = await getShowPeople(slug);
  const videos = hub.videos.filter((v) => v.showSlug === slug && v.category === `Season ${season.number}`);
  const ld = {
    '@context': 'https://schema.org', '@type': 'TVSeason', name: `${show.name} ${season.number}`, seasonNumber: season.number,
    partOfSeries: { '@type': 'TVSeries', name: show.name, url: `${SITE}/videos/shows/${show.slug}` },
    ...(season.firstAired ? { datePublished: season.firstAired } : {}), url: `${SITE}${seasonUrl(show.slug, season.number)}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <SeasonView show={show} season={season} all={show.seasons} people={people} videos={videos} />
    </>
  );
}
