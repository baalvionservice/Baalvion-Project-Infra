import type { Metadata } from 'next';
import { getMergedEntertainmentEntityBySlug } from '@/lib/entertainment-server';
import { getPersonBySlug } from '@/data/people';
import { entertainmentTypeLabel } from '@/types/entertainment';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// schema.org has no single generic "entertainment work" type -- map each of
// our 8 entity types to the closest real schema.org type instead of forcing
// everything under one inaccurate type.
const SCHEMA_TYPE: Record<string, string> = {
  movie: 'Movie',
  'tv-show': 'TVSeries',
  'streaming-show': 'TVSeries',
  'music-release': 'MusicAlbum',
  album: 'MusicAlbum',
  song: 'MusicRecording',
  award: 'Thing',
  event: 'Event',
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const entity = await getMergedEntertainmentEntityBySlug(slug);
  const url = `${SITE}/entertainment/${slug}`;

  if (!entity) {
    const humanized = `${titleCase(slug)} | Law Elite Network`;
    return { title: humanized, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  const title = entity.seo?.metaTitle || entity.title;
  const description = entity.seo?.metaDescription || entity.description.slice(0, 200);
  const image = entity.images?.[0]?.url || `${SITE}/opengraph-image`;

  return {
    title,
    description,
    keywords: [entity.title, entertainmentTypeLabel(entity.type), 'law elite network entertainment'],
    alternates: { canonical: entity.seo?.canonicalPath ? `${SITE}${entity.seo.canonicalPath}` : url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title, description, images: [{ url: image, alt: entity.title }] },
    twitter: { card: 'summary', title, description, images: [image] },
  };
}

export default async function EntertainmentEntityLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const entity = await getMergedEntertainmentEntityBySlug(slug);
  const url = `${SITE}/entertainment/${slug}`;

  if (!entity) return <>{children}</>;

  const entityLd = {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[entity.type] || 'CreativeWork',
    name: entity.title,
    url,
    image: entity.images?.[0]?.url,
    description: entity.description,
    datePublished: entity.releaseDate || undefined,
    // schema.org's cast/director/musicBy fields differ per @type -- rather
    // than branching to the "correct" property name per type (actor vs
    // byArtist vs director), a plain `creator` list is honest and valid
    // across all of them without a false claim of, say, "actor" on an award.
    creator: entity.peopleInvolved.map((credit) => {
      const person = getPersonBySlug(credit.personSlug);
      return {
        '@type': 'Person',
        name: person?.displayName || person?.fullName || credit.personSlug,
        url: person ? `${SITE}/people/${person.slug}` : undefined,
      };
    }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Entertainment', item: `${SITE}/entertainment` },
      { '@type': 'ListItem', position: 3, name: entity.title, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(entityLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
