/**
 * JSON-LD for the portfolio.
 *
 * The job here is not "add schema markup". It is to state, in a form a search engine can act on,
 * that these 19 properties are ONE company's portfolio rather than 19 unrelated domains. Without
 * that, every property competes as a stranger and the group's combined authority never
 * consolidates — which is the whole reason a hub like this is worth building.
 *
 * Two rules kept throughout:
 *   • Every value is derived from the registry or from the property's own live page. Nothing is
 *     asserted that could not be verified by loading the site.
 *   • No `aggregateRating`, `review`, `foundingDate`, employee counts or awards. Those are the
 *     fields that get a site a manual action, and we have no verified source for any of them.
 */
import { PRODUCTS, type Product } from './products';

export const SITE_URL = 'https://baalvionstack.com';
const LEGAL_NAME = 'Baalvion Industries Private Limited';

/** Stable @id values, so every graph node refers to the same entities rather than re-declaring them. */
const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

function productUrl(p: Product) {
  return `${SITE_URL}/products/${p.id}`;
}

/**
 * The publisher, and the portfolio hanging off it.
 *
 * `owns` is the important edge: it links the parent entity to each product's real domain, which is
 * what lets a search engine connect this hub to properties it has already crawled independently.
 */
export function organizationGraph() {
  const owned = PRODUCTS.filter((p) => p.href).map((p) => ({
    '@type': 'WebSite',
    '@id': `${p.href}/#website`,
    name: p.name,
    url: p.href,
    ...(p.description ? { description: p.description } : {}),
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: 'Baalvion',
        legalName: LEGAL_NAME,
        url: 'https://baalvion.com',
        description:
          'Baalvion Industries designs, builds and operates infrastructure across trade, commerce, markets and knowledge.',
        // Every domain the group publishes on. sameAs is how a crawler ties independently
        // discovered sites back to one owner.
        sameAs: PRODUCTS.filter((p) => p.href).map((p) => p.href as string),
        owns: owned,
      },
      {
        '@type': 'WebSite',
        '@id': SITE_ID,
        url: SITE_URL,
        name: 'Baalvion Stack',
        description:
          'The complete index of products built and operated by Baalvion Industries, with the operating status of each.',
        publisher: { '@id': ORG_ID },
        inLanguage: 'en',
      },
    ],
  };
}

/** The index page as an ordered list of products — a crawlable table of contents. */
export function catalogueGraph() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/#catalogue`,
    url: SITE_URL,
    name: 'Baalvion product catalogue',
    isPartOf: { '@id': SITE_ID },
    about: { '@id': ORG_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: PRODUCTS.length,
      itemListElement: PRODUCTS.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: productUrl(p),
        name: p.name,
      })),
    },
  };
}

/**
 * A single product.
 *
 * Typed `WebSite` rather than `SoftwareApplication` or `Product`: these are properties you visit,
 * not software you install or an item with a price. `Product` without an `offer` reads as an
 * incomplete listing, and inventing an offer to satisfy the schema would be a lie about what is
 * for sale.
 */
export function productGraph(p: Product) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${productUrl(p)}#page`,
        url: productUrl(p),
        name: p.name,
        ...(p.description ? { description: p.description } : {}),
        isPartOf: { '@id': SITE_ID },
        about: { '@id': ORG_ID },
        ...(p.image ? { primaryImageOfPage: `${SITE_URL}${p.image}` } : {}),
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Products', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: p.category, item: `${SITE_URL}/#${slug(p.category)}` },
            { '@type': 'ListItem', position: 3, name: p.name, item: productUrl(p) },
          ],
        },
      },
      // Only a property that actually serves traffic gets declared as a WebSite. Declaring one for
      // a domain that returns an error would point a crawler at a dead host under our own name.
      ...(p.href
        ? [
            {
              '@type': 'WebSite',
              '@id': `${p.href}/#website`,
              url: p.href,
              name: p.name,
              ...(p.tagline ? { alternateName: p.tagline } : {}),
              ...(p.description ? { description: p.description } : {}),
              publisher: { '@id': ORG_ID },
              inLanguage: 'en',
            },
          ]
        : []),
    ],
  };
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Render a graph as a script tag payload. */
export function jsonLd(data: unknown) {
  // JSON.stringify escapes nothing dangerous on its own; `<` is the one character that can break
  // out of a script element.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
