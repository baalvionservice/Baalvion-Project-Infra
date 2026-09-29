import type { Metadata } from 'next';
import { SITE } from './site';

/**
 * Metadata for a page the platform itself wrote and is happy to have indexed.
 *
 * Nothing a member wrote goes through here. The description is passed in as a literal by
 * the page, never derived from case, post or profile content — a metadata description is
 * shown in search results and in link previews in messaging apps, which is the single
 * easiest way for private writing to end up somewhere it was never meant to be.
 */
export function publicMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  updated,
}: {
  title: string;
  description: string;
  path: string;
  /** Absolute or root-relative path to a social image. Platform artwork only — never a
   *  member's photograph, and never anything derived from case content. */
  image?: string;
  type?: 'website' | 'article';
  /** ISO date, for article pages. Omitted entirely rather than defaulted to "now", which
   *  would tell a crawler every page changed on every deploy. */
  updated?: string;
}): Metadata {
  const url = `${SITE.url}${path}`;
  const images = image ? [{ url: `${SITE.url}${image}` }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} · ${SITE.name}`,
      description,
      url,
      siteName: SITE.name,
      type,
      ...(images ? { images } : {}),
      ...(updated ? { modifiedTime: updated } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} · ${SITE.name}`,
      description,
      ...(images ? { images } : {}),
    },
  };
}

/**
 * Structured data, rendered as a JSON-LD script.
 *
 * Serialised with a JSON.stringify that escapes `<`, so a stray angle bracket in a title
 * cannot close the script tag — the classic JSON-LD injection. Everything passed in here is
 * platform-authored anyway, and that is the rule: nothing a member wrote is ever described
 * to a search engine, so nothing member-written reaches this function.
 */
export function jsonLd(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c'),
  };
}

/**
 * For a page whose content belongs to a member. Sets an explicit, generic title so the
 * browser tab, the history entry and any link preview say nothing about what is on it.
 */
export function privateMetadata(title: string): Metadata {
  return {
    title,
    description: SITE.description,
    robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
    openGraph: undefined,
    twitter: undefined,
  };
}
