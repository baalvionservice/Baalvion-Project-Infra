/**
 * @fileOverview Specialized service for generating pSEO-optimized JSON-LD schemas.
 */
import { entityRouteSegment, isPublicCompany } from '@/lib/utils/seo';
import { env } from '@/config/env';
import { CompanyEntity } from '@/types/entity';

const siteUrl = () => (env.siteUrl.endsWith('/') ? env.siteUrl.slice(0, -1) : env.siteUrl);
const absoluteUrl = (path: string) => `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
const entityUrl = (type: string, slug: string) => absoluteUrl(`/${entityRouteSegment(type)}/${slug}`);

export const structuredData = {
  /**
   * Single source of truth for the Organization schema — imported by the root layout
   * (site-wide) so no page hand-rolls a second, divergent copy.
   */
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Imperialpedia',
    url: siteUrl(),
    logo: absoluteUrl('/logo.png'),
    description:
      'The definitive financial intelligence platform offering expert analysis and live market data.',
    contactPoint: {
      '@type': 'ContactPoint',
      email: env.supportEmail,
      contactType: 'customer support',
    },
    // Registered office of Baalvion Industries Private Limited (CIN
    // U43121OD2025PTC048479), the legal entity operating Imperialpedia.
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Upper Mania, PO Pakjhola, Semiliguda',
      addressLocality: 'Koraput',
      addressRegion: 'Odisha',
      postalCode: '764036',
      addressCountry: 'IN',
    },
    sameAs: [
      'https://twitter.com/imperialpedia',
      'https://linkedin.com/company/imperialpedia',
    ],
  }),

  /**
   * WebSite schema. No SearchAction: /search was permanently removed (see
   * REMOVED_PATHS in middleware.ts) and site search is now an inline modal/bar
   * with no query-string-driven results page for Sitelinks Search Box to target
   * — advertising one here just fed Google a dead URL (confirmed 404) it kept
   * re-crawling and reporting as "Crawled - currently not indexed" in GSC.
   */
  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Imperialpedia',
    alternateName: 'Imperialpedia — The Financial Intelligence Network',
    url: siteUrl(),
  }),

  entity: (entity: any, type: string) => {
    const base = {
      '@context': 'https://schema.org',
      name: entity.name,
      description: entity.description,
      url: entityUrl(type, entity.slug),
    };

    switch (type) {
      case 'country':
        return { ...base, '@type': 'Country' };
      case 'company':
        return structuredData.company(entity as CompanyEntity);
      case 'technology':
        // schema.org has no "Technology" type; "Thing" is the valid generic
        // supertype so the block is not silently dropped by crawlers.
        return { ...base, '@type': 'Thing' };
      case 'industry':
        return { ...base, '@type': 'Service' };
      default:
        return { ...base, '@type': 'Thing' };
    }
  },

  /**
   * Organization/Corporation schema for a company entity. Only emits properties the
   * entity actually has verified values for — no invented founders, logos, or execs.
   * Uses `Corporation` (a schema.org subtype of Organization that adds `tickerSymbol`)
   * when the company is known to be publicly traded, `Organization` otherwise.
   */
  company: (company: CompanyEntity) => {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': isPublicCompany(company) ? 'Corporation' : 'Organization',
      name: company.name,
      description: company.description,
      url: entityUrl('company', company.slug),
    };

    if (company.legalName) schema.legalName = company.legalName;
    if (company.logo) schema.logo = company.logo;
    if (company.website) schema.sameAs = [company.website, ...(company.sameAs ?? [])];
    else if (company.sameAs?.length) schema.sameAs = company.sameAs;
    if (company.founded_year) schema.foundingDate = String(company.founded_year);
    if (company.founders?.length) {
      schema.founder = company.founders.map((name) => ({ '@type': 'Person', name }));
    }
    if (company.headquarters) {
      schema.location = { '@type': 'Place', address: company.headquarters };
    }
    if (company.employees) {
      schema.numberOfEmployees = {
        '@type': 'QuantitativeValue',
        value: company.employees,
      };
    }
    if (company.industry) schema.industry = company.industry;
    // schema.org has no dedicated "stock exchange" property; tickerSymbol alone is the
    // standard machine-readable signal — the exchange itself is only shown in the visible UI.
    if (company.ticker) schema.tickerSymbol = company.ticker;
    if (company.parentOrganization) schema.parentOrganization = { '@type': 'Organization', name: company.parentOrganization };
    if (company.products?.length) {
      schema.makesOffer = company.products.map((productName) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Product', name: productName },
      }));
    }

    return schema;
  },

  /**
   * ItemList schema for an entity index/listing page (e.g. /companies). Represents
   * only the entities actually rendered on the current page, in position order.
   */
  itemList: (
    entities: { name: string; slug: string }[],
    type: string,
    startPosition = 1,
  ) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: entities.map((entity, index) => ({
      '@type': 'ListItem',
      position: startPosition + index,
      name: entity.name,
      url: entityUrl(type, entity.slug),
    })),
  }),

  /** WebPage schema — generic wrapper used alongside more specific entity/list schemas. */
  webPage: ({ name, description, path }: { name: string; description: string; path: string }) => ({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Imperialpedia',
      url: siteUrl(),
    },
  }),

  /** FAQPage schema — only call this when real, editorially authored FAQ content exists. */
  faqPage: (faq: { question: string; answer: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }),
};
