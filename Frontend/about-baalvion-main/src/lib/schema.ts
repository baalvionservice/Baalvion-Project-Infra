/**
 * Structured-data (schema.org JSON-LD) builders.
 *
 * Pure functions that return plain objects — components render them inside a
 * <script type="application/ld+json"> via the <JsonLd> component. Centralised
 * here so every page emits consistent, valid structured data.
 */
import type { FaqItem } from '@/lib/cms';

export const BASE_URL = 'https://about.baalvion.com';
export const ORG_NAME = 'Baalvion Industries';
export const SITE_NAME = 'Baalvion Operating System (BOS)';

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url.startsWith('http') ? c.url : `${BASE_URL}${c.url}`,
    })),
  };
}

export function faqSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceType || opts.name,
    url: opts.url.startsWith('http') ? opts.url : `${BASE_URL}${opts.url}`,
    provider: {
      '@type': 'Organization',
      name: ORG_NAME,
      url: BASE_URL,
    },
    areaServed: { '@type': 'Place', name: 'Global' },
  };
}

export function articleSchema(opts: {
  headline: string;
  description?: string;
  url: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    image: opts.image ? [opts.image] : undefined,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    author: [{ '@type': 'Organization', name: opts.author || ORG_NAME, url: BASE_URL }],
    publisher: { '@type': 'Organization', name: ORG_NAME, url: BASE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url.startsWith('http') ? opts.url : `${BASE_URL}${opts.url}` },
  };
}

export function collectionSchema(opts: {
  name: string;
  description: string;
  url: string;
  items: { name: string; url: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: opts.url.startsWith('http') ? opts.url : `${BASE_URL}${opts.url}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: opts.items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: it.url.startsWith('http') ? it.url : `${BASE_URL}${it.url}`,
      })),
    },
  };
}
