import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

async function fetchCategory(slug: string): Promise<any | null> {
  try {
    const r = await fetch(`${API}/categories`, { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const j = await r.json();
    const list = Array.isArray(j?.data) ? j.data : (j?.data?.items || []);
    return list.find((c: any) => c.slug === slug) || null;
  } catch {
    return null;
  }
}

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ categorySlug: string }> },
): Promise<Metadata> {
  const { categorySlug } = await params;
  const cat = await fetchCategory(categorySlug);
  const name = cat?.name || titleCase(categorySlug);
  const title = `${name} Attorneys & Legal Services | Law Elite Network`;
  const description = cat?.description
    || `Find verified ${name} lawyers across 188 countries and read expert ${name} guides on Law Elite Network.`;
  const url = `${SITE}/law/${categorySlug}`;
  return {
    title,
    description,
    keywords: [name, `${name} lawyer`, `${name} attorney`, 'legal advice', 'find a lawyer'],
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { type: 'website', url, title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CategoryLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ categorySlug: string }> },
) {
  const { categorySlug } = await params;
  const cat = await fetchCategory(categorySlug);
  const name = cat?.name || titleCase(categorySlug);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} Lawyers`,
    description: cat?.description || `Verified ${name} lawyers and legal resources.`,
    url: `${SITE}/law/${categorySlug}`,
    isPartOf: { '@type': 'WebSite', name: 'Law Elite Network', url: SITE },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name, item: `${SITE}/law/${categorySlug}` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
