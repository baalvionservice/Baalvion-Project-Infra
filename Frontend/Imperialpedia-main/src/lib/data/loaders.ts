/**
 * @fileOverview Global Data Loading Engine for Imperialpedia.
 * 
 * This module orchestrates the retrieval of knowledge nodes from the 
 * underlying dataset infrastructure. It is designed to scale to 1M+ entities
 * and is prepared for future integration with high-performance caches 
 * (Redis) and production databases.
 */

import countriesData from '@/data/countries/countries.json';
import companiesData from '@/data/companies/companies.json';
import industriesData from '@/data/industries/industries.json';
import technologiesData from '@/data/technologies/technologies.json';
import { 
  CountryEntity, 
  CompanyEntity, 
  IndustryEntity, 
  TechnologyEntity,
  EntityType,
  BaseEntity
} from '@/types/entity';

// --- Typed Loaders ---

export async function loadCountries(): Promise<CountryEntity[]> {
  // FUTURE: Integrate with Redis or Edge Caching for 1M+ node scale
  return countriesData as CountryEntity[];
}

export async function loadCompanies(): Promise<CompanyEntity[]> {
  return companiesData as CompanyEntity[];
}

export async function loadIndustries(): Promise<IndustryEntity[]> {
  return industriesData as IndustryEntity[];
}

export async function loadTechnologies(): Promise<TechnologyEntity[]> {
  return technologiesData as TechnologyEntity[];
}

// --- Slug-based Retrieval ---

export async function getCountryBySlug(slug: string): Promise<CountryEntity | undefined> {
  const data = await loadCountries();
  return data.find(item => item.slug === slug);
}

export async function getCompanyBySlug(slug: string): Promise<CompanyEntity | undefined> {
  const data = await loadCompanies();
  return data.find(item => item.slug === slug);
}

export async function getIndustryBySlug(slug: string): Promise<IndustryEntity | undefined> {
  const data = await loadIndustries();
  return data.find(item => item.slug === slug);
}

export async function getTechnologyBySlug(slug: string): Promise<TechnologyEntity | undefined> {
  const data = await loadTechnologies();
  return data.find(item => item.slug === slug);
}

/**
 * Generic entity fetcher for unified discovery flows.
 */
export async function getEntityBySlug(type: EntityType, slug: string): Promise<BaseEntity | undefined> {
  switch (type) {
    case 'country': return getCountryBySlug(slug);
    case 'company': return getCompanyBySlug(slug);
    case 'industry': return getIndustryBySlug(slug);
    case 'technology': return getTechnologyBySlug(slug);
    default: return undefined;
  }
}

// --- Bulk Retrievals ---

export async function getAllCountries() { return loadCountries(); }
export async function getAllCompanies() { return loadCompanies(); }
export async function getAllIndustries() { return loadIndustries(); }
export async function getAllTechnologies() { return loadTechnologies(); }
