import countries from '@/data/countries.json';
import companies from '@/data/companies.json';
import industries from '@/data/industries.json';
import technologies from '@/data/technologies.json';
import universities from '@/data/universities.json';
import people from '@/data/people.json';
import markets from '@/data/markets.json';
import { BaseEntity, EntityType, ID } from '@/types/entity';
import { getRelatedEntityIds } from './relations';

const allData: BaseEntity[] = [
  ...countries as any,
  ...companies as any,
  ...industries as any,
  ...technologies as any,
  ...universities as any,
  ...people as any,
  ...markets as any,
];

/**
 * Retrieves a single entity by its unique slug across all datasets.
 */
export function getEntityBySlug(slug: string): BaseEntity | undefined {
  return allData.find(e => e.slug === slug);
}

/**
 * Retrieves an entity by its ID node.
 */
export function getEntityById(id: ID): BaseEntity | undefined {
  return allData.find(e => e.id === id);
}

/**
 * Retrieves all entities of a specific type.
 */
export function getEntitiesByType(type: EntityType): BaseEntity[] {
  return allData.filter(e => e.type === type);
}

/**
 * Fetches entities connected through the Knowledge Graph relations matrix.
 */
export function getGraphRelatedEntities(entityId: ID): BaseEntity[] {
  const relatedIds = getRelatedEntityIds(entityId);
  return allData.filter(e => relatedIds.includes(e.id));
}

/**
 * Finds entities related to the given entity based on shared tags, country, or industry.
 * Legacy helper maintained for initial discovery logic.
 */
export function getRelatedEntities(entity: BaseEntity): BaseEntity[] {
  return allData.filter(e => 
    e.id !== entity.id && 
    (e.country === entity.country || e.industry === entity.industry || e.tags.some(t => entity.tags.includes(t)))
  ).slice(0, 5);
}
