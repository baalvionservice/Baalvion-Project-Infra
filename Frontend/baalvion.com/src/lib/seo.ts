import type { Metadata } from 'next';
import { SITE } from './content';

interface PageMetadataInput {
  /** Page-specific title (the root layout's `%s | Baalvion` template applies automatically). */
  title: string;
  description: string;
  /** Site-relative path, e.g. '/trust/governance'. */
  path: string;
  /** Set true for auth surfaces that must never be indexed. */
  noindex?: boolean;
}

/**
 * Builds full per-page metadata, including Open Graph and Twitter card
 * fields. Next.js only template-resolves `title` automatically — nested
 * objects like `openGraph`/`twitter` are inherited verbatim from the root
 * layout unless a page restates them, so every route needs its own call
 * here or it silently shows the homepage's social preview instead of its
 * own.
 */
export function pageMetadata({ title, description, path, noindex }: PageMetadataInput): Metadata {
  const url = path === '/' ? SITE.url : `${SITE.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE.name,
      title,
      description,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}
