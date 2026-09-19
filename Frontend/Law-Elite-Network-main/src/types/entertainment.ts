/**
 * @fileOverview LEN Entertainment entities — one reusable shape for every
 * kind of entertainment work (movies, TV shows, streaming shows, music
 * releases, albums, songs, awards, and events), mirroring how @/types/person.ts
 * handles eleven person categories with one Person type. `type` is the only
 * thing that varies; people-relationships, media, related articles, related
 * entities, and SEO fields apply identically across all eight.
 *
 * No general business-intelligence fields (box office, revenue, budget,
 * market share) — this is an editorial/reference layer, not a financial one.
 */

import type { MediaItem } from './media';

export const ENTERTAINMENT_TYPES = [
  { slug: 'movie', singular: 'Movie', plural: 'Movies' },
  { slug: 'tv-show', singular: 'TV Show', plural: 'TV Shows' },
  { slug: 'streaming-show', singular: 'Streaming Show', plural: 'Streaming Shows' },
  { slug: 'music-release', singular: 'Music Release', plural: 'Music Releases' },
  { slug: 'album', singular: 'Album', plural: 'Albums' },
  { slug: 'song', singular: 'Song', plural: 'Songs' },
  { slug: 'award', singular: 'Award', plural: 'Awards' },
  { slug: 'event', singular: 'Entertainment Event', plural: 'Entertainment Events' },
] as const;

export type EntertainmentTypeSlug = (typeof ENTERTAINMENT_TYPES)[number]['slug'];

export function entertainmentTypeLabel(slug: EntertainmentTypeSlug): string {
  return ENTERTAINMENT_TYPES.find((t) => t.slug === slug)?.plural ?? slug;
}

/**
 * The actor↔movie / artist↔album / director↔movie relationship — one shape
 * for every kind of involvement rather than a `cast[]` + `crew[]` +
 * `artists[]` field per entity type. `role` is free-text on purpose (real
 * credits vary: "Actor", "Director", "Producer", "Artist", "Narrator",
 * "Host", "Writer", "Recipient" for an award) rather than a closed enum that
 * would need updating for every new kind of credit.
 */
export interface EntertainmentPersonInvolvement {
  personSlug: string;
  role: string;
  /** Character/role played, when applicable (acting credits only). */
  character?: string;
}

export interface EntertainmentImage {
  url: string;
  alt: string;
  /** e.g. "poster", "still", "cover art" — free-text caption of what the image is. */
  caption?: string;
}

export interface RelatedEntertainmentEntity {
  slug: string;
  /** Nature of the connection, e.g. "Sequel", "Same franchise", "Won at this ceremony". */
  relationship?: string;
}

export interface EntertainmentSeoFields {
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath?: string;
}

export interface EntertainmentVerification {
  verified: boolean;
  sourceNote?: string;
  lastReviewedAt?: string;
}

export interface EntertainmentEntity {
  /** URL slug — /entertainment/{slug}. */
  slug: string;
  title: string;
  type: EntertainmentTypeSlug;
  /** ISO date, or just a year ('1994') when the exact date isn't the relevant fact. */
  releaseDate?: string;
  description: string;

  images?: EntertainmentImage[];

  /** The actor→movie / artist→album / director→movie relationships (see EntertainmentPersonInvolvement). */
  peopleInvolved: EntertainmentPersonInvolvement[];

  /** Manually curated for now, same interim approach as Person.relatedArticleSlugs — resolved to real articles, never fabricated. */
  relatedArticleSlugs?: string[];
  videos?: MediaItem[];
  interviews?: MediaItem[];

  relatedEntities?: RelatedEntertainmentEntity[];

  seo?: EntertainmentSeoFields;
  verification: EntertainmentVerification;
}
