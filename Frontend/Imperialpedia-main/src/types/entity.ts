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
