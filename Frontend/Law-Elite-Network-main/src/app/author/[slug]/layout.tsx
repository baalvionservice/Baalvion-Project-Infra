import type { Metadata } from 'next';
import { getAuthorBySlug } from '@/data/authors';
import { cmsGetAuthorBySlug } from '@/lib/cms';
import { resolvePersonImage } from '@/lib/article-art';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** CMS profile wins; the bundled contributor profile fills the gap. */
async function resolveAuthor(slug: string) {
  const fromCms = await cmsGetAuthorBySlug(slug);
  if (fromCms) return fromCms;
  return getAuthorBySlug(slug);
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const a = await resolveAuthor(slug);
  const url = `${SITE}/author/${slug}`;
  if (!a) {
    const humanized = `${titleCase(slug)} | Law Elite Network`;
    return { title: humanized, alternates: { canonical: url }, robots: { index: false, follow: true } };
  }
  const title = `${a.name}${a.title ? ` — ${a.title}` : ''}`;
  const description = String(a.bio || `${a.name} writes legal-education guides for Law Elite Network.`).slice(0, 200);
  const image = resolvePersonImage({ avatarUrl: (a as { avatarUrl?: string }).avatarUrl, name: a.name, avatarSeed: (a as { avatarSeed?: string }).avatarSeed || slug });
  return {
    title,
    description,
    keywords: [a.name, a.title, ...(a.expertise || []), 'legal editor', 'law elite network contributor'].filter(
      (x): x is string => Boolean(x),
    ),
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'profile', url, title, description, images: [{ url: image, alt: a.name }] },
    twitter: { card: 'summary', title, description, images: [image] },
  };
}

export default async function AuthorLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const a = await resolveAuthor(slug);
  const url = `${SITE}/author/${slug}`;
  const image = a && resolvePersonImage({ avatarUrl: (a as { avatarUrl?: string }).avatarUrl, name: a.name, avatarSeed: (a as { avatarSeed?: string }).avatarSeed || slug });
  const sameAs = a?.social ? [a.social.linkedin, a.social.x].filter(Boolean) : undefined;

  const personLd = a && {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: a.name,
    url,
    image,
    jobTitle: a.title || undefined,
    description: a.bio || undefined,
    knowsAbout: a.expertise && a.expertise.length ? a.expertise : undefined,
    // Bar admission / experience line — shown to human readers under the byline
    // (see the `credentials` field on CmsAuthor/LawAuthor) but previously absent
    // from structured data, so crawlers had no machine-readable E-E-A-T signal.
    hasCredential: a.credentials
      ? { '@type': 'EducationalOccupationalCredential', name: a.credentials }
      : undefined,
    sameAs: sameAs && sameAs.length ? sameAs : undefined,
    worksFor: { '@type': 'Organization', name: 'Law Elite Network', url: SITE },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Contributors', item: `${SITE}/authors` },
      { '@type': 'ListItem', position: 3, name: a?.name || titleCase(slug), item: url },
    ],
  };

  return (
    <>
      {personLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
