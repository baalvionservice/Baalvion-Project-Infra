import type { Metadata } from 'next';
import { getAuthorByName } from '@/data/authors';
import { resolveArticleImage } from '@/lib/article-art';
import { extractFaqFromHtml } from '@/lib/seo/faq-extractor';
import { fetchArticleForMetadata } from '@/lib/article-metadata-fetch';
import { articleUrl } from '@/lib/article-url';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const a = await fetchArticleForMetadata(slug);
  // Points canonical at the nested URL whenever the article has enough taxonomy
  // to build one -- even though this legacy route redirects there anyway, any
  // crawler that briefly indexes this URL before following the redirect should
  // still see the correct canonical.
  const url = `${SITE}${articleUrl(a ? { ...a, slug } : { slug })}`;
  // No server-side record: humanize the slug so the title is still specific (not bare "Article").
  if (!a) {
    const humanized = `${titleCase(slug)} | Law Elite Network`;
    return { title: humanized, alternates: { canonical: url }, openGraph: { type: 'article', url, title: humanized } };
  }
  const title = a.title;
  const description = String(a.excerpt || a.title).slice(0, 300);
  const authorName = (typeof a.author === 'string' ? a.author : a.author?.name) || a.author_name || undefined;
  const ogImage = resolveArticleImage({ ...a, title, slug });
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
  const a = await fetchArticleForMetadata(slug);
  const url = `${SITE}${articleUrl(a ? { ...a, slug } : { slug })}`;
  const bylineName = (typeof a?.author === 'string' ? a.author : a?.author?.name) || undefined;
  const matchedAuthor = bylineName ? getAuthorByName(bylineName) : null;
  const authorLd = matchedAuthor
    ? { '@type': 'Person', name: matchedAuthor.name, url: `${SITE}/author/${matchedAuthor.slug}` }
    : { '@type': 'Organization', name: 'Law Elite Network' };
  const articleImage = a ? resolveArticleImage({ ...a, title: a.title, slug }) : undefined;
  const jsonLd = a && {
    '@context': 'https://schema.org',
    '@type': a.contentType === 'news' ? 'NewsArticle' : 'Article',
    headline: a.title,
    description: a.excerpt || undefined,
    image: articleImage ? [articleImage] : undefined,
    datePublished: a.published_at || undefined,
    dateModified: a.updated_at || a.published_at || undefined,
    mainEntityOfPage: url,
    author: authorLd,
    publisher: { '@type': 'Organization', name: 'Law Elite Network', logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-article-excerpt]'],
    },
  };
  const faqPairs = a ? extractFaqFromHtml(a.body) : [];
  const faqLd = faqPairs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqPairs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;
  const cat = a?.category;
  const crumbs: Array<{ name: string; item: string }> = [{ name: 'Home', item: SITE }];
  if (cat?.name && cat?.slug) crumbs.push({ name: cat.name, item: `${SITE}/law/${cat.slug}` });
  crumbs.push({ name: a?.title || titleCase(slug), item: url });
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
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}
      {children}
    </>
  );
}
