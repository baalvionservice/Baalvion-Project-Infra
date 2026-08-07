import type { Metadata } from 'next';
import { getAuthorByName } from '@/data/authors';
import { resolveArticleImage } from '@/lib/article-art';
import { extractFaqFromHtml } from '@/lib/seo/faq-extractor';
import { articleUrl } from '@/lib/article-url';
import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';

const titleCase = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Shared metadata builder for every route that can render an article page
 * (legacy flat /article/[slug] and canonical /[categorySlug]/[articleSlug]).
 * Keeps title/canonical/OG/Twitter generation identical across both so a bug
 * fixed once doesn't regress on the other.
 */
export function buildArticleMetadata(article: any | null, slug: string, site: string): Metadata {
  const url = `${site}${articleUrl(article ? { ...article, slug } : { slug })}`;
  // No server-side record: humanize the slug so the title is still specific (not bare "Article").
  if (!article) {
    const humanized = `${titleCase(slug)} | Law Elite Network`;
    return { title: humanized, alternates: { canonical: url }, openGraph: { type: 'article', url, title: humanized } };
  }
  const title = article.title;
  const description = String(article.excerpt || article.title).slice(0, 300);
  const authorName = (typeof article.author === 'string' ? article.author : article.author?.name) || article.author_name || undefined;
  const ogImage = resolveArticleImage({ ...article, title, slug });
  return {
    title,
    description,
    keywords: [...(article.tags || []), 'legal guide', 'law', 'legal advice'].filter(Boolean),
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      publishedTime: article.published_at || undefined,
      modifiedTime: article.updated_at || undefined,
      authors: authorName ? [authorName] : undefined,
      images: [{ url: ogImage, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

/**
 * Shared Article/NewsArticle + FAQPage + BreadcrumbList JSON-LD, rendered as
 * `<script>` tags. Breadcrumb trail is derived from the article's own
 * category (not the requested URL segments), so it's correct even when a
 * route renders an article at a shorter URL than its full taxonomy.
 */
export function ArticleJsonLd({ article, slug, site }: { article: any | null; slug: string; site: string }) {
  const url = `${site}${articleUrl(article ? { ...article, slug } : { slug })}`;
  const bylineName = (typeof article?.author === 'string' ? article.author : article?.author?.name) || undefined;
  const matchedAuthor = bylineName ? getAuthorByName(bylineName) : null;
  const authorLd = matchedAuthor
    ? { '@type': 'Person', name: matchedAuthor.name, url: `${site}/author/${matchedAuthor.slug}` }
    : { '@type': 'Organization', name: 'Law Elite Network' };
  const articleImage = article ? resolveArticleImage({ ...article, title: article.title, slug }) : undefined;
  const jsonLd = article && {
    '@context': 'https://schema.org',
    '@type': article.contentType === 'news' ? 'NewsArticle' : 'Article',
    headline: article.title,
    description: article.excerpt || undefined,
    image: articleImage ? [articleImage] : undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    mainEntityOfPage: url,
    author: authorLd,
    publisher: { '@type': 'Organization', name: 'Law Elite Network', logo: { '@type': 'ImageObject', url: `${site}/logo.png` } },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-article-excerpt]'],
    },
  };
  const faqPairs = article ? extractFaqFromHtml(article.body) : [];
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
  const cat = article?.category;
  // Same real-category check as Breadcrumbs.tsx / article-url.ts -- a CMS
  // article's category slug may not be one of the 8 real category pages, and
  // this JSON-LD is structured data Google actually parses, so an `item` URL
  // that 404s here is worse than a broken visible link.
  const catIsReal = !!cat?.slug && (CURRENT_CATEGORY_SLUGS as readonly string[]).includes(cat.slug);
  const crumbs: Array<{ name: string; item: string }> = [{ name: 'Home', item: site }];
  if (catIsReal && cat?.name && cat?.slug) crumbs.push({ name: cat.name, item: `${site}/${cat.slug}` });
  crumbs.push({ name: article?.title || titleCase(slug), item: url });
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
    </>
  );
}
