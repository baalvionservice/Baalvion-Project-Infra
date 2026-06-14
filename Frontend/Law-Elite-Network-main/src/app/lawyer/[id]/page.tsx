import type { Metadata } from 'next';
import LawyerProfileClient from './LawyerProfileClient';

// Server component: emits unique, indexable metadata + Attorney structured data for
// every practitioner (core to ranking each lawyer globally), then renders the client UI.
const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3015/v1';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

async function fetchLawyer(id: string): Promise<any | null> {
  try {
    const r = await fetch(`${API}/lawyers/${id}`, { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const l = await fetchLawyer(id);
  if (!l) return { title: 'Practitioner Not Found', robots: { index: false, follow: true } };

  const specs = (l.specializations || []).join(', ');
  const primarySpec = (l.specializations || [])[0];
  const loc = [l.city, l.country].filter(Boolean).join(', ');
  const title = `${l.name} — ${primarySpec ? `${primarySpec} Attorney` : 'Attorney'}${loc ? ` in ${loc}` : ''} | Law Elite Network`;
  const description = String(
    l.bio || `${l.name} is a verified ${specs || 'legal'} practitioner${loc ? ` based in ${loc}` : ''} on Law Elite Network — connect with elite counsel worldwide.`,
  ).slice(0, 300);
  const url = `${SITE}/lawyer/${id}`;

  return {
    title,
    description,
    keywords: [l.name, ...(l.specializations || []), l.country, l.city, 'lawyer', 'attorney', 'legal consultation'].filter(Boolean) as string[],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'profile',
      url,
      title,
      description,
      images: l.profile_photo ? [{ url: l.profile_photo, alt: l.name }] : undefined,
    },
    twitter: { card: 'summary', title, description, images: l.profile_photo ? [l.profile_photo] : undefined },
  };
}

function attorneyJsonLd(l: any, id: string) {
  const url = `${SITE}/lawyer/${id}`;
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Attorney',
    '@id': url,
    name: l.name,
    url,
    image: l.profile_photo || undefined,
    description: l.bio || undefined,
    knowsAbout: l.specializations || undefined,
    knowsLanguage: l.languages || undefined,
    areaServed: l.country || undefined,
    address: (l.city || l.country) ? {
      '@type': 'PostalAddress',
      addressLocality: l.city || undefined,
      addressCountry: l.country_code || l.country || undefined,
    } : undefined,
  };
  if (Number(l.total_reviews) > 0) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(l.rating),
      reviewCount: Number(l.total_reviews),
      bestRating: 5,
    };
  }
  return node;
}

function breadcrumbJsonLd(l: any, id: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Lawyers', item: `${SITE}/lawyers` },
      { '@type': 'ListItem', position: 3, name: l.name, item: `${SITE}/lawyer/${id}` },
    ],
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await fetchLawyer(id);
  return (
    <>
      {l && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(attorneyJsonLd(l, id)) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(l, id)) }}
          />
        </>
      )}
      <LawyerProfileClient id={id} />
    </>
  );
}
