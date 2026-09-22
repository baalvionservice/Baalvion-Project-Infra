import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PersonView } from '@/components/videos/PersonView';
import { fetchPhotosFor } from '@/lib/photos-api';
import { getShowPeople, getShowPerson, getVideoHub, personUrl } from '@/lib/videos-hub';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const hub = await getVideoHub();
  const lists = await Promise.all(hub.shows.map(async (s) => (await getShowPeople(s.slug)).filter((p) => p.hasProfile).map((p) => ({ slug: s.slug, person: p.slug }))));
  return lists.flat();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; person: string }> }): Promise<Metadata> {
  const { slug, person: ps } = await params;
  const [hub, person] = await Promise.all([getVideoHub(), getShowPerson(slug, ps)]);
  const show = hub.shows.find((s) => s.slug === slug);
  if (!show || !person) return { robots: { index: false } };
  const seasons = person.appearances.map((a) => `${show.name} ${a.season}`).join(', ');
  const desc = person.seoDescription || person.overview.split(/\n{2,}/)[0]?.slice(0, 200) || `${person.name} in ${seasons}.`;
  return {
    title: person.seoTitle || `${person.name}: ${seasons}`,
    description: desc,
    alternates: { canonical: `${SITE}${personUrl(slug, person.slug)}` },
    // No thin pages: indexed only once an editor has written the profile.
    robots: { index: person.indexable, follow: true },
    openGraph: { type: 'profile', title: person.name, description: desc },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string; person: string }> }) {
  const { slug, person: ps } = await params;
  const [hub, person, everyone] = await Promise.all([getVideoHub(), getShowPerson(slug, ps), getShowPeople(slug)]);
  const show = hub.shows.find((s) => s.slug === slug);
  if (!show || !person) notFound();
  const [photos] = await Promise.all([fetchPhotosFor('show-participant', `${slug}-${person.slug}`)]);
  const videos = hub.videos.filter((v) => v.showSlug === slug && v.peopleSlugs.includes(person.slug));
  const costars = person.appearances.map((a) => ({
    season: a.season,
    people: everyone.filter((p) => p.slug !== person.slug && p.appearances.some((x) => x.season === a.season)).sort((x, y) => Number(y.hasProfile) - Number(x.hasProfile)).slice(0, 12),
  }));
  const ld = { '@context': 'https://schema.org', '@type': 'Person', name: person.name, url: `${SITE}${personUrl(slug, person.slug)}`, ...(person.knownFor ? { description: person.knownFor } : {}), ...(photos[0] ? { image: `${SITE}${photos[0].url}` } : {}) };
  const faq = person.faq.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: person.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  return (
    <>
      {person.overview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />}
      {faq && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      <PersonView show={show} person={person} photos={photos} videos={videos} costars={costars} />
    </>
  );
}
