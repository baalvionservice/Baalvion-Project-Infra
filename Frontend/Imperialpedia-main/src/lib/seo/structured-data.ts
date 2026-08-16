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
    reviewedBy?: { name: string; url?: string };
    factCheckedBy?: { name: string; url?: string };
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
    ...(data.reviewedBy && {
      reviewedBy: { '@type': 'Person', name: data.reviewedBy.name, url: data.reviewedBy.url },
    }),
    // No dedicated schema.org "fact-checker" property exists yet — `contributor`
    // is the closest standard fit for a named editorial role beyond author/reviewer.
    ...(data.factCheckedBy && {
      contributor: {
        '@type': 'Person',
        name: data.factCheckedBy.name,
        url: data.factCheckedBy.url,
        description: 'Fact-checked this article',
      },
    }),
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

  newsArticle: (data: {
    title: string;
    description: string;
    image: string;
    authorName: string;
    datePublished: string;
    dateModified?: string;
    reviewedBy?: { name: string; url?: string };
    factCheckedBy?: { name: string; url?: string };
  }): StructuredData => ({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: data.title,
    description: data.description,
    image: [data.image],
    author: [
      {
        '@type': 'Person',
        name: data.authorName,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Imperialpedia',
      logo: { '@type': 'ImageObject', url: 'https://imperialpedia.com/logo.png' },
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    ...(data.reviewedBy && {
      reviewedBy: { '@type': 'Person', name: data.reviewedBy.name, url: data.reviewedBy.url },
    }),
    ...(data.factCheckedBy && {
      contributor: {
        '@type': 'Person',
        name: data.factCheckedBy.name,
        url: data.factCheckedBy.url,
        description: 'Fact-checked this article',
      },
    }),
  }),

  /**
   * `speakable` property value to merge into an Article/NewsArticle node
   * (points AI-assistant/voice speakable extraction at the headline + description).
   * Not a standalone top-level entity — spread into the parent schema object.
   */
  speakable: (cssSelector: string[] = ['h1', '[data-article-description]']) => ({
    '@type': 'SpeakableSpecification',
    cssSelector,
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

  person: (data: {
    name: string;
    jobTitle: string;
    description: string;
    url: string;
    image?: string;
    sameAs?: string[];
    /** Degrees/schools (from the author's `education` field) — emitted as `alumniOf`. */
    alumniOf?: string[];
    /** Focus areas (from the author's `expertise` field) — emitted as `knowsAbout`. */
    knowsAbout?: string[];
  }): StructuredData => ({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: data.name,
      jobTitle: data.jobTitle,
      description: data.description,
      url: data.url,
      image: data.image,
      sameAs: data.sameAs,
      alumniOf: data.alumniOf?.length
        ? data.alumniOf.map((name) => ({ '@type': 'EducationalOrganization', name }))
        : undefined,
      knowsAbout: data.knowsAbout?.length ? data.knowsAbout : undefined,
      worksFor: {
        '@type': 'Organization',
        name: 'Imperialpedia',
        url: 'https://imperialpedia.com',
      },
    },
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
