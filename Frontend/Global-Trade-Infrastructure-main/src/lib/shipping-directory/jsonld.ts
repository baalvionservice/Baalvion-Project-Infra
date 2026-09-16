/**
 * @file lib/shipping-directory/jsonld.ts
 * @description Structured data for the directory.
 *
 * The point of this file is entity resolution, not rich snippets. A page titled "Maersk"
 * is a string a search engine has to disambiguate against a hundred other Maersks; a page
 * that emits an Organization with `sameAs` pointing at its Wikidata item, its Wikipedia
 * article and its own website is telling the engine *which* Maersk, and lets it merge
 * this page into a knowledge-graph entity it already holds. That is what makes a
 * reference directory indexable at 100k pages instead of being treated as thin content.
 *
 * Two rules:
 *   1. Nothing is asserted here that the page does not also show a human. Structured data
 *      that goes beyond the visible page is cloaking, and it is also just lying.
 *   2. Every field is dropped when its value is null. An empty `foundingDate: ""` is worse
 *      than no foundingDate — it asserts we checked and found nothing.
 */
import type { Company, Vessel } from './api';
import { canonical, commonsImage } from './site';

type Json = Record<string, unknown>;

/** Drop null/undefined/empty entries so no claim is made from a missing value. */
function compact<T extends Json>(obj: T): T {
  const out: Json = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

export function jsonLdProps(data: Json) {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, '\\u003c') },
  } as const;
}

const wikidataUrl = (qid: string | null | undefined) =>
  (qid ? `https://www.wikidata.org/wiki/${qid}` : null);

export function organizationJsonLd(c: Company, path: string): Json {
  const sameAs = [c.website, c.wikipedia_url, wikidataUrl(c.wikidata_qid)].filter(Boolean);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${canonical(path)}#organization`,
    url: canonical(path),
    name: c.name,
    legalName: c.legal_name || undefined,
    // The visible page quotes this same paragraph, attributed. Nothing extra is asserted.
    description: c.summary || c.description || undefined,
    logo: commonsImage(c.logo_url, 512) || undefined,
    image: commonsImage(c.image_url, 1200) || commonsImage(c.logo_url, 512) || undefined,
    foundingDate: c.founded_year ? String(c.founded_year) : undefined,
    dissolutionDate: c.dissolved_year ? String(c.dissolved_year) : undefined,
    numberOfEmployees: c.employee_count
      ? compact({ '@type': 'QuantitativeValue', value: c.employee_count })
      : undefined,
    // Founders are people we hold named records for; the page lists exactly these.
    founder: (c.founders || []).map((p) => compact({
      '@type': 'Person',
      name: p.name,
      description: p.description || undefined,
      sameAs: wikidataUrl(p.qid) || undefined,
    })),
    address: c.headquarters || c.country
      ? compact({
        '@type': 'PostalAddress',
        addressLocality: c.headquarters || undefined,
        addressCountry: c.country_code || c.country || undefined,
      })
      : undefined,
    // A head office only gets coordinates when the ingest resolved real ones.
    location: c.hq_lat != null && c.hq_lon != null
      ? compact({
        '@type': 'Place',
        name: c.headquarters || c.name,
        geo: { '@type': 'GeoCoordinates', latitude: Number(c.hq_lat), longitude: Number(c.hq_lon) },
      })
      : undefined,
    parentOrganization: c.parent_name
      ? { '@type': 'Organization', name: c.parent_name }
      : undefined,
    subOrganization: (c.subsidiaries || []).slice(0, 20).map((o) => compact({
      '@type': 'Organization', name: o.name, sameAs: wikidataUrl(o.qid) || undefined,
    })),
    identifier: [
      c.isin ? { '@type': 'PropertyValue', propertyID: 'ISIN', value: c.isin } : null,
      c.lei ? { '@type': 'PropertyValue', propertyID: 'LEI', value: c.lei } : null,
      c.wikidata_qid ? { '@type': 'PropertyValue', propertyID: 'Wikidata', value: c.wikidata_qid } : null,
    ].filter(Boolean),
    industry: c.industry || undefined,
    tickerSymbol: c.ticker || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  });
}

/**
 * A ship. schema.org has no vessel type, so `Vehicle` is the honest nearest fit — it is
 * the type search engines actually understand for "a large made thing with a
 * manufacturer, a production date and dimensions". `additionalProperty` carries the
 * marine identifiers that have no schema.org equivalent (IMO, MMSI, call sign), which is
 * exactly what that field is for.
 */
export function vesselJsonLd(v: Vessel, path: string, typeLabel: string): Json {
  const props = [
    v.imo_number ? { '@type': 'PropertyValue', propertyID: 'IMO', name: 'IMO number', value: v.imo_number } : null,
    v.mmsi ? { '@type': 'PropertyValue', propertyID: 'MMSI', name: 'MMSI', value: v.mmsi } : null,
    v.call_sign ? { '@type': 'PropertyValue', propertyID: 'CallSign', name: 'Call sign', value: v.call_sign } : null,
    v.gross_tonnage ? { '@type': 'PropertyValue', name: 'Gross tonnage', value: v.gross_tonnage, unitText: 'GT' } : null,
    v.deadweight_tons ? { '@type': 'PropertyValue', name: 'Deadweight', value: Number(v.deadweight_tons), unitText: 'DWT' } : null,
    v.capacity_teu ? { '@type': 'PropertyValue', name: 'Container capacity', value: Number(v.capacity_teu), unitText: 'TEU' } : null,
    v.flag_country ? { '@type': 'PropertyValue', name: 'Flag state', value: v.flag_country } : null,
    v.vessel_class ? { '@type': 'PropertyValue', name: 'Class', value: v.vessel_class } : null,
    v.yard_number ? { '@type': 'PropertyValue', name: 'Yard number', value: v.yard_number } : null,
  ].filter(Boolean);

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    '@id': `${canonical(path)}#vessel`,
    url: canonical(path),
    name: v.name,
    description: v.summary || `${typeLabel}${v.imo_number ? `, IMO ${v.imo_number}` : ''}${v.flag_country ? `, flagged ${v.flag_country}` : ''}.`,
    image: commonsImage(v.image_url, 1200) || undefined,
    vehicleIdentificationNumber: v.imo_number || undefined,
    productionDate: v.year_built ? String(v.year_built) : undefined,
    manufacturer: v.builder_name ? { '@type': 'Organization', name: v.builder_name } : undefined,
    vehicleConfiguration: typeLabel,
    weight: v.gross_tonnage
      ? { '@type': 'QuantitativeValue', value: v.gross_tonnage, unitText: 'GT' }
      : undefined,
    height: undefined,
    additionalProperty: props,
    sameAs: [v.wikipedia_url, v.source_url].filter(Boolean),
  });
}

export function breadcrumbJsonLd(trail: { label: string; path?: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => compact({
      '@type': 'ListItem',
      position: i + 1,
      name: t.label,
      item: t.path ? canonical(t.path) : undefined,
    })),
  };
}

/**
 * A list page's contents, as an ItemList.
 *
 * Only the URLs actually rendered on the page are included. Listing the whole 96,000-row
 * result set in the markup of a 50-row page would be a claim about the page that is not
 * true of it — the remaining rows are reachable through pagination, which is what
 * `rel=next` and the sitemap are for.
 */
export function itemListJsonLd(
  items: { name: string; path: string }[],
  { name, offset = 0 }: { name: string; offset?: number },
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: items.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: offset + i + 1,
      name: it.name,
      url: canonical(it.path),
    })),
  };
}

/**
 * The directory itself, as a Dataset.
 *
 * This is the type that gets a reference corpus into Google's dataset surfaces, and it is
 * the honest description of what this site is: a licensed derivative of Wikidata and
 * Wikipedia, with a stated coverage and a stated licence.
 */
export function datasetJsonLd(totals: { vessels: number; companies: number } | null): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${canonical()}#dataset`,
    name: 'World Shipping Directory',
    url: canonical(),
    description: totals
      ? `Reference records for ${totals.vessels.toLocaleString('en-US')} IMO-numbered merchant and state-operated vessels and ${totals.companies.toLocaleString('en-US')} shipping companies, with fleet composition, tonnage, flag states, ownership and published capacity rankings. Every figure carries its source.`
      : 'Reference records for merchant vessels and the companies that own and operate them.',
    license: 'https://creativecommons.org/licenses/by-sa/4.0/',
    isBasedOn: ['https://www.wikidata.org', 'https://en.wikipedia.org'],
    creator: { '@type': 'Organization', name: 'Baalvion', url: 'https://baalvion.com' },
    keywords: ['shipping companies', 'merchant vessels', 'IMO number', 'container lines', 'fleet', 'gross tonnage', 'flag state'],
  });
}

export function webSiteJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${canonical()}#website`,
    url: canonical(),
    name: 'World Shipping Directory',
    publisher: { '@type': 'Organization', name: 'Baalvion' },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${canonical('ships')}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}
