import type { Metadata } from 'next';
import { cmsGetArticleBySlug } from '@/lib/cms';

const API = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

async function fetchFromLawService(slug: string): Promise<any | null> {
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

/**
 * Source-of-truth order for SEO metadata/JSON-LD: central CMS first, then
 * law-service. Mirrors the client page so the indexed title/description/canonical
 * track whatever is authoritative in the admin console.
 */
async function fetchArticle(slug: string): Promise<any | null> {
  const cms = await cmsGetArticleBySlug(slug);
  if (cms) {
    return {
      id: cms.id,
      title: cms.title,
      excerpt: cms.excerpt,
      tags: [],
      category: cms.category,
      updated_at: cms.updatedAt,
      published_at: cms.updatedAt,
    };
  }
  return fetchFromLawService(slug);
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const a = await fetchArticle(slug);
  const url = `${SITE}/article/${slug}`;
  // No server-side record: humanize the slug so the title is still specific (not bare "Article").
  if (!a) {
    const humanized = `${titleCase(slug)} | Law Elite Network`;
    return { title: humanized, alternates: { canonical: url }, openGraph: { type: 'article', url, title: humanized } };
  }
  const title = a.title;
  const description = String(a.excerpt || a.title).slice(0, 300);
  const authorName = a.author?.name || a.author_name || undefined;
  const ogImage = a.cover_image || a.image_url || `https://picsum.photos/seed/${a.id || slug}/1200/630`;
  return {
    title,
    description,
    keywords: [...(a.tags || []), 'legal guide', 'law', 'legal advice'].filter(Boolean),
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: a.published_at || undefined,
      modifiedTime: a.updated_at || undefined,
      authors: authorName ? [authorName] : undefined,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
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
  // Breadcrumb trail: Home → (category hub, when known) → Article.
  const cat = a?.category;
  const crumbs: Array<{ name: string; item: string }> = [{ name: 'Home', item: SITE }];
  if (cat?.name && cat?.slug) crumbs.push({ name: cat.name, item: `${SITE}/law/${cat.slug}` });
  crumbs.push({ name: a?.title || titleCase(slug), item: `${SITE}/article/${slug}` });
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };
  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {children}
    </>
  );
}
