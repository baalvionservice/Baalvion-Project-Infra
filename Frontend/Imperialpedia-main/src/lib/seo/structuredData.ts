/**
 * @fileOverview Specialized service for generating pSEO-optimized JSON-LD schemas.
 */

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
      url: `https://imperialpedia.com/${type}s/${entity.slug}`,
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
        return { ...base, '@type': 'Technology' };
      case 'industry':
        return { ...base, '@type': 'Service' };
      default:
        return base;
    }
  }
};
