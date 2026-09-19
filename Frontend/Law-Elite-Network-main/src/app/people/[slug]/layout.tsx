import type { Metadata } from 'next';
import { getMergedPersonBySlug } from '@/lib/people-server';
import { resolvePersonImage } from '@/lib/article-art';
import { isPersonCategorySlug, personCategoryLabel } from '@/types/person';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const url = `${SITE}/people/${slug}`;

  if (isPersonCategorySlug(slug)) {
    const label = personCategoryLabel(slug);
    const title = `${label} — Law Elite Network`;
    const description = `Reference profiles for notable ${label.toLowerCase()} covered across Law Elite Network.`;
    return {
      title,
      description,
      keywords: [label.toLowerCase(), 'law elite network people'],
      alternates: { canonical: url },
      robots: { index: true, follow: true },
      openGraph: { type: 'website', url, title, description },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  const person = await getMergedPersonBySlug(slug);

  if (!person) {
    const humanized = `${titleCase(slug)} | Law Elite Network`;
    return { title: humanized, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }

  const name = person.displayName || person.fullName;
  const title = person.seo?.metaTitle || `${name} — ${personCategoryLabel(person.category).replace(/s$/, '')} Profile`;
  const description = person.seo?.metaDescription || person.biography.slice(0, 200);
  const personImage = resolvePersonImage({ avatarUrl: person.avatarUrl, name, avatarSeed: person.avatarSeed || slug });
  // Same reasoning as /author/[slug]/layout.tsx: social crawlers don't fetch
  // data: URIs for og:image, so a profile with no real photo yet falls back
  // to the site's branded share image instead of a blank preview.
  const image = personImage.startsWith('data:') ? `${SITE}/opengraph-image` : personImage;

  return {
    title,
    description,
    keywords: [name, personCategoryLabel(person.category), 'law elite network people'],
    alternates: { canonical: person.seo?.canonicalPath ? `${SITE}${person.seo.canonicalPath}` : url },
    robots: { index: true, follow: true },
    openGraph: { type: 'profile', url, title, description, images: [{ url: image, alt: name }] },
    twitter: { card: 'summary', title, description, images: [image] },
  };
}

export default async function PersonLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const person = await getMergedPersonBySlug(slug);
  const url = `${SITE}/people/${slug}`;

  if (!person) return <>{children}</>;

  const name = person.displayName || person.fullName;
  const image = resolvePersonImage({ avatarUrl: person.avatarUrl, name, avatarSeed: person.avatarSeed || slug });
  const sameAs = person.social ? Object.values(person.social).filter(Boolean) : undefined;

  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    alternateName: person.displayName ? person.fullName : undefined,
    url,
    image,
    birthDate: person.birthDate || undefined,
    birthPlace: person.birthPlace || undefined,
    deathDate: person.deathDate || undefined,
    nationality: person.countryCode || undefined,
    description: person.biography,
    sameAs: sameAs && sameAs.length ? sameAs : undefined,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'People', item: `${SITE}/people` },
      { '@type': 'ListItem', position: 3, name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
