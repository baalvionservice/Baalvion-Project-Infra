import { ENTERTAINMENT_ENTITIES, getEntertainmentEntityBySlug } from '@/data/entertainment';
import { getRelatedArticles } from '@/lib/related-content';
import type { EntertainmentEntity, EntertainmentTypeSlug } from '@/types/entertainment';
import type { EntityReference } from '@/types/entity-tagging';

/**
 * Server-side entertainment directory — bundled only for now, shaped exactly
 * like people-server.ts's merge layer. No CMS `entertainment` table exists
 * yet; a future one slots in here the same way, without touching any caller
 * (`/entertainment`, `/entertainment/[slug]`).
 */
export async function getMergedEntertainmentEntities(): Promise<EntertainmentEntity[]> {
  return ENTERTAINMENT_ENTITIES;
}

export async function getMergedEntertainmentEntityBySlug(slug: string): Promise<EntertainmentEntity | null> {
  return getEntertainmentEntityBySlug(slug);
}

export async function getMergedEntertainmentByType(type: EntertainmentTypeSlug): Promise<EntertainmentEntity[]> {
  return ENTERTAINMENT_ENTITIES.filter((e) => e.type === type);
}

/** Every person/entity this entertainment entity is genuinely, explicitly connected to (cast/crew, sequels/franchise entries). */
function getRelatedEntitiesForEntertainment(entity: EntertainmentEntity): EntityReference[] {
  const refs: EntityReference[] = entity.peopleInvolved.map((credit) => ({ entityType: 'person', slug: credit.personSlug }));
  entity.relatedEntities?.forEach((rel) => refs.push({ entityType: 'entertainment', slug: rel.slug }));
  return refs;
}

/**
 * Direct auto-detected mentions first, then articles connected to the
 * cast/crew or a related entry — see @/lib/related-content.ts for the
 * relevance rule and dedup/cap logic.
 */
export async function getLatestNewsForEntity(entity: EntertainmentEntity): Promise<any[]> {
  return getRelatedArticles('entertainment', entity.slug, {
    relatedEntities: getRelatedEntitiesForEntertainment(entity),
    manualSlugs: entity.relatedArticleSlugs,
  });
}
