import { StructuredData } from '@/types';

/**
 * Utility to generate JSON-LD structured data for various content types.
 * Supports Articles, FAQs, Breadcrumbs, Organization, and SoftwareApplication schemas.
 */
export const structuredData = {
  organization: (): StructuredData => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Imperialpedia',
    url: 'https://imperialpedia.com',
    logo: 'https://imperialpedia.com/logo.png',
    sameAs: [
      'https://twitter.com/imperialpedia',
      'https://github.com/imperialpedia',
    ],
  }),

  article: (data: {
    title: string;
    description: string;
    image: string;
    authorName: string;
    datePublished: string;
    dateModified?: string;
  }): StructuredData => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    image: [data.image],
    author: [
      {
        '@type': 'Person',
        name: data.authorName,
      },
    ],
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
  }),

  breadcrumb: (items: { name: string; item: string }[]): StructuredData => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  }),

  faq: (questions: { question: string; answer: string }[]): StructuredData => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }),

  softwareApp: (data: { name: string; description: string; url: string; category?: string }): StructuredData => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: data.name,
    description: data.description,
    applicationCategory: data.category || 'FinanceApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }),
};
