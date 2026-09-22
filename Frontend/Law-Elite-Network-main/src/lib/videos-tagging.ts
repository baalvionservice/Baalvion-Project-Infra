import { getShowPeople, getVideoHub, personUrl, showUrl } from '@/lib/videos-hub';
import type { EntityRegistryEntry } from '@/lib/entity-registry';

/** Nicknames that are safe to match in text. A bare common word such as "Scout" is not, so only the distinctive handle is listed. */
const EXTRA_NAMES: Record<string, string[]> = { 'bigg-boss/tanmay-singh': ['ScoutOP'] };
const TOO_GENERIC = new Set(['Scout']);

export const showPersonKey = (showSlug: string, slug: string) => `${showSlug}/${slug}`;

/**
 * Shows and their written housemate profiles as taggable entities: an article that names "Kanika Mann" or
 * "Bigg Boss" connects to the right pages automatically, with no editor step. Only people with a written
 * profile are registered, so a name without a page is never tagged.
 */
export async function getShowTaggingEntries(): Promise<EntityRegistryEntry[]> {
  const hub = await getVideoHub();
  const entries: EntityRegistryEntry[] = hub.shows.map((s) => ({ entityType: 'video-show', slug: s.slug, names: [s.name] }));
  const lists = await Promise.all(hub.shows.map(async (s) => (await getShowPeople(s.slug)).filter((p) => p.hasProfile)));
  lists.flat().forEach((p) => {
    const m = p.name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    const names = [...(m ? [m[1].trim(), m[2].trim()] : [p.name]), ...(EXTRA_NAMES[showPersonKey(p.showSlug, p.slug)] ?? [])].filter((n) => !TOO_GENERIC.has(n));
    entries.push({ entityType: 'show-person', slug: showPersonKey(p.showSlug, p.slug), names });
  });
  return entries;
}

/** Display name and URL for each tagged show and person, for the "Connections" list on an article. */
export async function getShowTaggingLookups(): Promise<Map<string, { name: string; url: string }>> {
  const hub = await getVideoHub();
  const map = new Map<string, { name: string; url: string }>();
  hub.shows.forEach((s) => map.set(`video-show:${s.slug}`, { name: s.name, url: showUrl(s.slug) }));
  const lists = await Promise.all(hub.shows.map((s) => getShowPeople(s.slug)));
  lists.flat().forEach((p) => map.set(`show-person:${showPersonKey(p.showSlug, p.slug)}`, { name: p.name, url: personUrl(p.showSlug, p.slug) }));
  return map;
}
