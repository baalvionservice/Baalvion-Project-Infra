/**
 * @fileOverview Specialized service for generating pSEO-optimized JSON-LD schemas.
 */
import { entityRouteSegment } from '@/lib/utils/seo';

export const structuredData = {
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Imperialpedia',
    url: 'https://imperialpedia.com',
    logo: 'https://imperialpedia.com/logo.png',
    sameAs: [
      'https://twitter.com/imperialpedia',
      'https://linkedin.com/company/imperialpedia',
    ],
  }),

  entity: (entity: any, type: string) => {
    const base = {
      '@context': 'https://schema.org',
      name: entity.name,
      description: entity.description,
      url: `https://imperialpedia.com/${entityRouteSegment(type)}/${entity.slug}`,
    };

    switch (type) {
      case 'country':
        return { ...base, '@type': 'Country' };
      case 'company':
        return { 
          ...base, 
          '@type': 'Organization',
          foundingDate: entity.founded_year,
          numberOfEmployees: entity.employees,
        };
      case 'technology':
        // schema.org has no "Technology" type; "Thing" is the valid generic
        // supertype so the block is not silently dropped by crawlers.
        return { ...base, '@type': 'Thing' };
      case 'industry':
        return { ...base, '@type': 'Service' };
      default:
        return { ...base, '@type': 'Thing' };
    }
  }
};
