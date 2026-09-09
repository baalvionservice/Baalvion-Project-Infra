/**
 * Who this company legally is.
 *
 * Every public property renders the operator's identity somewhere — a footer, a copyright line, a
 * privacy policy, an OpenGraph tag, a schema.org block. When each one carries its own copy of that
 * string they drift, and the drift is not cosmetic: ir.baalvion.com published the company under a
 * US corporate suffix while baalvionstack.com published the registered Indian private-limited name.
 * On an investor-facing site that is a factual misstatement about the entity being invested in,
 * which is the single most expensive place to be careless.
 *
 * These are public registry facts, so unlike the billing entities in `@baalvion/sites`
 * (`legalEntities.ts`, deliberately deploy-time configuration) they are committed here. The two
 * answer different questions: that one asks whose books a payment lands in, this one asks what name
 * goes on the page. Keep them separate.
 *
 * Nothing here is a guess. Anything not verifiable from the incorporation record does not belong.
 */

export interface PostalAddress {
  /** Street / building / care-of line, as filed. */
  readonly street: string;
  readonly locality: string;
  readonly region: string;
  readonly postalCode: string;
  /** ISO 3166-1 alpha-2. */
  readonly country: string;
}

/** The registered name. Use this wherever the operator is named in a legal or investor context. */
export const LEGAL_ENTITY_NAME = 'Baalvion Industries Private Limited';

/**
 * Only where the full name genuinely will not fit — a dense footer column, a form label. Never in a
 * copyright line, a policy document, or structured data; those get the registered name.
 */
export const LEGAL_ENTITY_NAME_SHORT = 'Baalvion Industries Pvt. Ltd.';

/** Marketing use only. A brand is not an entity and cannot be the subject of a legal statement. */
export const BRAND_NAME = 'Baalvion';

export const CIN = 'U43121OD2025PTC048479';

export const ENTITY_TYPE = 'Private Limited Company';

export const JURISDICTION = 'IN';

/** ISO 8601. The company is younger than most of the claims a site might be tempted to make about it. */
export const INCORPORATED_ON = '2025-03-11';

/** The address on the incorporation record. Correspondence does not go here. */
export const REGISTERED_ADDRESS: PostalAddress = {
  street: 'C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola',
  locality: 'Semiliguda, Koraput',
  region: 'Odisha',
  postalCode: '764036',
  country: 'IN',
};

/** Where post actually reaches a human. */
export const OPERATING_ADDRESS: PostalAddress = {
  street: 'Yeshwant Avenue Building, NX Road, Y K Nagar',
  locality: 'Virar West, Virar',
  region: 'Maharashtra',
  postalCode: '401303',
  country: 'IN',
};

export const IR_EMAIL = 'invrel@baalvion.com';

/** E.164, so it stays dialable when a page renders it as a tel: link. */
export const IR_PHONE = '+918951284770';

/** The same number spaced for reading. Display only — never put this in a tel: href. */
export const IR_PHONE_DISPLAY = '+91 89512 84770';

/**
 * Unlisted. There is no ticker, no share price and no market data, so no property should render a
 * stock section, an earnings call, or anything else that presumes a public listing.
 */
export const IS_PUBLICLY_LISTED = false;

/** One line, in the order Indian addresses are written. */
export function formatAddress(address: PostalAddress): string {
  return `${address.street}, ${address.locality}, ${address.region} ${address.postalCode}, India`;
}

/**
 * The copyright line. Pass the year explicitly rather than defaulting to `new Date()`: a statically
 * rendered page bakes the build year in and then silently shows a stale one, and a client component
 * that reads the clock at render time hydrates to a different string than the server sent.
 */
export function copyrightLine(year: number): string {
  return `© ${year} ${LEGAL_ENTITY_NAME}. All rights reserved.`;
}

/**
 * The schema.org Organization block, identical on every property.
 *
 * `Organization`, not `Corporation` — schema.org's Corporation is defined as an organization with
 * publicly traded shares, which this is not. `legalName` carries the registered name and `name` may
 * carry the brand, which is exactly the distinction the two fields exist for.
 */
export function organizationJsonLd(options: {
  /** Absolute URL of the property this block appears on. */
  url: string;
  /** Defaults to the brand. Pass a property name where the site is its own brand. */
  name?: string;
  /** Absolute URL of a logo, when the property has one. */
  logo?: string;
  /** Profile URLs that genuinely belong to the company. Omit rather than invent. */
  sameAs?: readonly string[];
  /** The registered office is the legal answer; pass 'operating' for a contact-page block. */
  address?: 'registered' | 'operating';
}): Record<string, unknown> {
  const address = options.address === 'operating' ? OPERATING_ADDRESS : REGISTERED_ADDRESS;
  const block: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name ?? BRAND_NAME,
    legalName: LEGAL_ENTITY_NAME,
    url: options.url,
    foundingDate: INCORPORATED_ON,
    identifier: { '@type': 'PropertyValue', name: 'CIN', value: CIN },
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.locality,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: address.country,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'investor relations',
      email: IR_EMAIL,
      telephone: IR_PHONE,
    },
  };
  if (options.logo) block.logo = options.logo;
  if (options.sameAs?.length) block.sameAs = [...options.sameAs];
  return block;
}
