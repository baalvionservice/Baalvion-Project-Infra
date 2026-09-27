import { ID, Slug, Timestamp } from "./common";

// Re-export ID for use in other modules
export type { ID } from "./common";

export type EntityType =
  | "country"
  | "city"
  | "company"
  | "industry"
  | "technology"
  | "person"
  | "university"
  | "market"
  | "dataset";

export enum RelationType {
  COMPANY_INDUSTRY = "COMPANY_INDUSTRY",
  COMPANY_COUNTRY = "COMPANY_COUNTRY",
  COMPANY_TECHNOLOGY = "COMPANY_TECHNOLOGY",
  TECHNOLOGY_INDUSTRY = "TECHNOLOGY_INDUSTRY",
  PERSON_COMPANY = "PERSON_COMPANY",
  UNIVERSITY_COUNTRY = "UNIVERSITY_COUNTRY",
  MARKET_INDUSTRY = "MARKET_INDUSTRY",
  COMPETITOR = "COMPETITOR",
}

export interface EntityRelation {
  source_id: ID;
  target_id: ID;
  relation_type: RelationType | string;
}

/**
 * Base interface for all knowledge nodes in the Imperialpedia Index.
 */
export interface BaseEntity {
  id: ID;
  name: string;
  slug: Slug;
  type: EntityType;
  description: string;
  // Long-form editorial profile (several paragraphs) rendered as its own "About"
  // section — distinct from `description`, which is a single short overview
  // rendered as one pull-quote-style paragraph (see EntityOverview.tsx) and was
  // never meant to hold real article-length depth. Optional: absent entities
  // simply don't render the section rather than showing an empty block.
  editorialOverview?: string;
  category: string;
  tags: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
  // Optional relational fields
  country?: string;
  industry?: string;
}

export interface CountryEntity extends BaseEntity {
  type: "country";
  capital: string;
  region: string;
  population: number;
  gdp: string;
  currency: string;
  official_language: string;
  industries: string[];
  technologies: string[];
}

export interface CompanyExecutive {
  name: string;
  title: string;
}

export interface CompanyEntity extends BaseEntity {
  type: "company";
  industry: string;
  country: string;
  founded_year: number;
  headquarters: string;
  employees: number;
  website: string;
  technologies: string[];
  competitors: string[];
  // Stock ticker, when publicly traded (null for private companies e.g. OpenAI).
  // Powers the live quote section on /companies/[slug] via imperialpedia-service's
  // /assets/:symbol (synced from cms-service's live market-data pipeline).
  ticker?: string | null;
  // Registered legal name, when it differs from the common/brand name (e.g. "Alphabet Inc.").
  legalName?: string;
  // Absolute URL to a verified brand logo. Renders nothing when absent — never a placeholder.
  logo?: string;
  // Founding individuals — a stable historical fact, safe to publish even for entities
  // whose current leadership changes over time.
  founders?: string[];
  // Current CEO / executive roster. Intentionally left unset in bundled fallback data
  // (see src/data/companies/companies.json) because leadership changes frequently and
  // a hand-typed static value would silently go stale; populate from the live entity
  // service (imperialpedia-service), which can be kept current, not from static JSON.
  ceo?: string;
  executives?: CompanyExecutive[];
  // Primary listing venue, e.g. "NASDAQ" / "NYSE". Omit for private companies.
  stockExchange?: string;
  // Derived from ticker presence, not editorially set — true when the company is
  // publicly traded (drives Organization vs Corporation JSON-LD @type).
  isPublic?: boolean;
  // Named products/services. Only rendered when populated — never inferred.
  products?: string[];
  // Verified canonical profiles (Wikipedia, Wikidata, official social) for schema.org sameAs.
  sameAs?: string[];
  // Parent company name, when this entity is a subsidiary.
  parentOrganization?: string;
  // Editorially authored FAQ pairs. Drives the FAQPage section + schema — omitted entirely
  // (not rendered as an empty section) when no real FAQ content exists for the company.
  faq?: { question: string; answer: string }[];
}

export interface IndustryEntity extends BaseEntity {
  type: "industry";
  sector: string;
  global_market_size: string;
  growth_rate: string;
  top_countries: string[];
  key_companies: string[];
  related_technologies: string[];
}

export interface TechnologyEntity extends BaseEntity {
  type: "technology";
  category: string;
  invented_year: number;
  applications: string[];
  use_cases: string[];
  key_companies: string[];
  related_technologies: string[];
}
