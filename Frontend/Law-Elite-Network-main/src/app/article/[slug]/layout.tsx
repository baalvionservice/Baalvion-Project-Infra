import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3015/v1';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

async function fetchArticle(slug: string): Promise<any | null> {
  try {
    // /articles/:slug resolves by slug (the ?slug= list filter is not applied server-side).
    const r = await fetch(`${API}/articles/${encodeURIComponent(slug)}`, { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const a = await fetchArticle(slug);
  const url = `${SITE}/article/${slug}`;
  if (!a) return { title: 'Article', alternates: { canonical: url } };
  const title = a.title;
  const description = String(a.excerpt || a.title).slice(0, 300);
  return {
    title,
    description,
    keywords: [...(a.tags || []), 'legal guide', 'law', 'legal advice'].filter(Boolean),
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: a.published_at || undefined,
      modifiedTime: a.updated_at || undefined,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ArticleLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const a = await fetchArticle(slug);
  const jsonLd = a && {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt || undefined,
    datePublished: a.published_at || undefined,
    dateModified: a.updated_at || a.published_at || undefined,
    mainEntityOfPage: `${SITE}/article/${slug}`,
    author: { '@type': 'Organization', name: 'Law Elite Network' },
    publisher: { '@type': 'Organization', name: 'Law Elite Network', logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
  };
  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      {children}
    </>
  );
}
