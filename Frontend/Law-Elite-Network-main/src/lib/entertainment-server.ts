import { ENTERTAINMENT_ENTITIES } from '@/data/entertainment';
import { fetchApiEntertainment } from '@/lib/entertainment-api';
import { overlay } from '@/lib/overlay';
import { fetchEntityPhotos } from '@/lib/photos-api';
import { getRelatedArticles } from '@/lib/related-content';
import type { EntertainmentEntity, EntertainmentTypeSlug } from '@/types/entertainment';
import type { EntityReference } from '@/types/entity-tagging';
import type { RelatedWork } from '@/types/person';

/**
 * Entertainment entries as the site shows them: the bundled set overlaid with
 * what editors manage in the admin panel (see overlay). If law-service is
 * unreachable the bundled set is served unchanged.
 */
export async function getMergedEntertainmentEntities(): Promise<EntertainmentEntity[]> {
  const [api, photos] = await Promise.all([fetchApiEntertainment(), fetchEntityPhotos()]);
  return overlay(ENTERTAINMENT_ENTITIES, api.entities, api.hidden).map((e) => {
    const photo = photos.get(`entertainment:${e.slug}`);
    return photo && !e.images?.length
      ? { ...e, images: [{ url: photo.url, alt: photo.alt, caption: photo.credit, credit: photo.credit, license: photo.license, licenseUrl: photo.licenseUrl, sourceUrl: photo.sourceUrl }] }
      : e;
  });
}

export async function getMergedEntertainmentEntityBySlug(slug: string): Promise<EntertainmentEntity | null> {
  return (await getMergedEntertainmentEntities()).find((e) => e.slug === slug.toLowerCase()) ?? null;
}

export async function getMergedEntertainmentByType(type: EntertainmentTypeSlug): Promise<EntertainmentEntity[]> {
  return (await getMergedEntertainmentEntities()).filter((e) => e.type === type);
}

/** The entries an entity says it is related to (sequel, same franchise, won at this ceremony...), resolved against the merged set. */
export async function getMergedRelatedEntertainment(entity: EntertainmentEntity): Promise<EntertainmentEntity[]> {
  if (!entity.relatedEntities?.length) return [];
  const all = await getMergedEntertainmentEntities();
  return entity.relatedEntities.map((r) => all.find((e) => e.slug === r.slug)).filter((e): e is EntertainmentEntity => !!e);
}

const WORK_TYPE: Partial<Record<EntertainmentTypeSlug, RelatedWork['type']>> = {
  movie: 'movie', 'tv-show': 'show', 'streaming-show': 'show', album: 'album', 'music-release': 'album', song: 'song',
};

/**
 * A person's credited works, derived from the entries that credit them, so an
 * editor who credits someone on a film never has to also edit that person's
 * profile. Awards and events are left out: a profile lists works, and those
 * are reachable from the entry's own related links.
 */
export async function getCreditedWorksForPerson(personSlug: string): Promise<RelatedWork[]> {
  return (await getMergedEntertainmentEntities()).flatMap((e) => {
    const type = WORK_TYPE[e.type];
    const credit = e.peopleInvolved.find((c) => c.personSlug === personSlug);
    if (!type || !credit) return [];
    return [{ title: e.title, type, year: e.releaseDate ? Number(e.releaseDate.slice(0, 4)) || undefined : undefined, role: [credit.role, credit.character].filter(Boolean).join(' · '), entitySlug: e.slug }];
  });
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
