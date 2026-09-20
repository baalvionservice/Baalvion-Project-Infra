import { getMergedPeople } from '@/lib/people-server';
import { getMergedEntertainmentEntities } from '@/lib/entertainment-server';
import { personUrl } from '@/lib/person-url';
import { entertainmentUrl } from '@/lib/entertainment-url';
import { mediaSlug } from '@/lib/media-url';
import { getAllPodcasts, getPodcastBySlug } from '@/data/podcasts';
import { PHOTO_GALLERIES } from '@/data/galleries';
import type { EntityType } from '@/types/entity-tagging';
import type { MediaItem, PhotoGallery, Podcast } from '@/types/media';

export type MediaKind = 'video' | 'interview';

export interface MediaEntry extends MediaItem {
  kind: MediaKind;
  slug: string;
  /** The profile this clip belongs to, so a card can say who/what it is about. */
  subject: { name: string; href: string; type: 'Person' | 'Entertainment'; entityType: EntityType; slug: string };
}

/**
 * Every real video/interview attached to a Person or entertainment profile,
 * flattened into one list. Nothing is generated: an entry exists only when
 * someone attached a hosted clip to a profile, so both pages fill in on their
 * own as profiles get media, and stay empty (rather than padded) until then.
 */
export async function getAllMedia(kind: MediaKind): Promise<MediaEntry[]> {
  const [people, entities] = await Promise.all([getMergedPeople(), getMergedEntertainmentEntities()]);
  const field = kind === 'video' ? 'videos' : 'interviews';
  const seen = new Set<string>();
  const out: MediaEntry[] = [];

  const add = (items: MediaItem[] | undefined, subject: MediaEntry['subject']) => {
    (items ?? []).forEach((item) => {
      if (!item?.url || seen.has(item.url)) return;
      seen.add(item.url);
      out.push({ ...item, kind, slug: mediaSlug(item), subject });
    });
  };

  people.forEach((p) =>
    add(p[field], { name: p.displayName || p.fullName, href: personUrl(p.slug), type: 'Person', entityType: 'person', slug: p.slug }),
  );
  entities.forEach((e) =>
    add(e[field], { name: e.title, href: entertainmentUrl(e.slug), type: 'Entertainment', entityType: 'entertainment', slug: e.slug }),
  );

  return out.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
}

export async function getMediaBySlug(kind: MediaKind, slug: string): Promise<MediaEntry | null> {
  return (await getAllMedia(kind)).find((m) => m.slug === slug) ?? null;
}

export { getAllPodcasts, getPodcastBySlug };
export type { Podcast };

export interface GalleryEntry extends PhotoGallery {
  subject?: { name: string; href: string };
}

/** Curated galleries plus one per person who has photos attached. */
export async function getAllGalleries(): Promise<GalleryEntry[]> {
  const people = await getMergedPeople();
  const derived: GalleryEntry[] = people
    .filter((p) => (p.photos?.length ?? 0) > 0)
    .map((p) => {
      const name = p.displayName || p.fullName;
      return {
        slug: `${p.slug}-photos`,
        title: `${name}: photos`,
        photos: p.photos!,
        personSlug: p.slug,
        subject: { name, href: personUrl(p.slug) },
      };
    });
  const curated = await Promise.all(
    PHOTO_GALLERIES.map(async (g) => {
      const person = g.personSlug ? people.find((p) => p.slug === g.personSlug) : undefined;
      return person ? { ...g, subject: { name: person.displayName || person.fullName, href: personUrl(person.slug) } } : g;
    }),
  );
  const seen = new Set<string>();
  return [...curated, ...derived].filter((g) => g.photos.length > 0 && !seen.has(g.slug) && !!seen.add(g.slug));
}

export async function getGalleryBySlug(slug: string): Promise<GalleryEntry | null> {
  return (await getAllGalleries()).find((g) => g.slug === slug) ?? null;
}
