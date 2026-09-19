/**
 * @fileOverview LEN People — one reusable Person entity shape shared by every
 * public-figure vertical (actors, musicians, directors, producers, TV
 * personalities, influencers, creators, athletes, lawyers, judges, and other
 * notable figures), instead of a separate type/route/component tree per
 * category. `category` is the only thing that varies; every field below
 * applies across all eleven — a lawyer and an actor use the same `career`,
 * `timeline`, and `relatedWorks` shapes, just populated differently.
 *
 * Deliberately excludes political-party figures and general business/CEO
 * profiles — this is a media/public-figure layer, not a business or
 * political database (see PERSON_CATEGORIES below for the closed set).
 */

import type { MediaItem } from './media';

/** Closed set — do not add political or general-business categories here. */
export const PERSON_CATEGORIES = [
  { slug: 'actors', singular: 'Actor', plural: 'Actors' },
  { slug: 'musicians', singular: 'Musician', plural: 'Musicians' },
  { slug: 'directors', singular: 'Director', plural: 'Directors' },
  { slug: 'producers', singular: 'Producer', plural: 'Producers' },
  { slug: 'tv-personalities', singular: 'TV Personality', plural: 'TV Personalities' },
  { slug: 'influencers', singular: 'Influencer', plural: 'Influencers' },
  { slug: 'creators', singular: 'Creator', plural: 'Creators' },
  { slug: 'athletes', singular: 'Athlete', plural: 'Athletes' },
  { slug: 'lawyers', singular: 'Lawyer', plural: 'Lawyers' },
  { slug: 'judges', singular: 'Judge', plural: 'Judges' },
  { slug: 'other', singular: 'Public Figure', plural: 'Other Public Figures' },
] as const;

export type PersonCategorySlug = (typeof PERSON_CATEGORIES)[number]['slug'];

export function personCategoryLabel(slug: PersonCategorySlug): string {
  return PERSON_CATEGORIES.find((c) => c.slug === slug)?.plural ?? slug;
}

/** Type guard used by /people/[slug] to tell a category directory ("/people/actors") apart from an individual profile slug ("/people/tom-hanks") sharing the same route segment. */
export function isPersonCategorySlug(slug: string): slug is PersonCategorySlug {
  return PERSON_CATEGORIES.some((c) => c.slug === slug);
}

export interface PersonSocialLinks {
  x?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  wikipedia?: string;
}

export interface PersonCareerEntry {
  title: string;
  organization?: string;
  startYear?: number;
  /** Omit for a role that's still current. */
  endYear?: number;
  description?: string;
}

export interface PersonEducationEntry {
  institution: string;
  degree?: string;
  year?: number;
}

export interface PersonTimelineEntry {
  /** Year, or a full date when known precisely (ISO 'YYYY-MM-DD'). */
  date: string;
  title: string;
  description?: string;
}

export interface RelatedPerson {
  slug: string;
  /** Nature of the connection, e.g. "Frequent collaborator", "Co-founded Amblin Entertainment". */
  relationship?: string;
}

export interface RelatedOrganization {
  name: string;
  /** e.g. "Founder", "President", "Signed artist". Omit if merely affiliated. */
  role?: string;
  url?: string;
}

/**
 * One reusable shape for "notable work" across every vertical — a movie, a
 * show, an album, a sports event/team, or a legal matter — rather than a
 * separate filmography/discography/case-list type per category.
 */
export interface RelatedWork {
  title: string;
  type: 'movie' | 'show' | 'album' | 'song' | 'sports-event' | 'team' | 'legal-case' | 'other';
  role?: string;
  year?: number;
  url?: string;
  /**
   * Slug into whichever data source matches `type` — @/data/entertainment.ts
   * for movie/show/album/song, @/data/sports-teams.ts for team — when this
   * work has a full entity profile. Resolve the URL with
   * @/lib/related-work-url.ts's `relatedWorkUrl()` rather than assuming one
   * prefix. Omitted for work with no dedicated entity yet.
   */
  entitySlug?: string;
}

/** @deprecated alias kept so existing imports of `PersonMediaItem` keep working — use `MediaItem` directly in new code. */
export type PersonMediaItem = MediaItem;

export interface PersonSeoFields {
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath?: string;
}

/**
 * One shape for a career milestone, reused for both "Achievements" and
 * "Major Competitions" (same kind of fact — a title, a year, optionally a
 * linked competition) rather than two different record shapes.
 * `competitionSlug` mirrors RelatedWork.entitySlug -- links to a real
 * @/data/sports-competitions.ts entry when one exists.
 */
export interface PersonAchievement {
  title: string;
  year?: number;
  competitionSlug?: string;
}

/**
 * Sport-specific information, kept as one optional nested field rather than
 * new top-level Person fields — every non-athlete category (actors, lawyers,
 * judges, ...) is unaffected, and adding another sport-specific field later
 * (e.g. `retiredNumber`) only touches this interface. `statistics` is a
 * free-form label->value map on purpose: a basketball career and a track
 * career have nothing in common statistically, and forcing one schema across
 * every sport is exactly the "unnecessarily complex sports database" this
 * was built to avoid.
 */
export interface PersonSportsInfo {
  sport: string;
  /** Position (team sports) or event (individual sports, e.g. "100m sprint"). */
  position?: string;
  /** Current/most notable team. `teamSlug` links to @/data/sports-teams.ts when a full Team entity exists; `team` is a plain-text fallback otherwise. */
  team?: string;
  teamSlug?: string;
  achievements?: PersonAchievement[];
  majorCompetitions?: PersonAchievement[];
  statistics?: Record<string, string>;
}

export type PersonStatus = 'active' | 'retired' | 'inactive' | 'deceased';

export interface PersonVerification {
  verified: boolean;
  /** Free-text note on provenance, e.g. "Public biographical record — independent reference profile." */
  sourceNote?: string;
  lastReviewedAt?: string;
}

export interface Person {
  /** URL slug — /people/{slug}. */
  slug: string;
  fullName: string;
  /** Public-facing name, if different from fullName (stage name, ring name, etc.). */
  displayName?: string;
  category: PersonCategorySlug;
  /** ISO 3166-1 alpha-2, matches @/lib/countries.ts. */
  countryCode?: string;

  avatarUrl?: string;
  /** Deterministic fallback seed for the silhouette placeholder when no real photo is set. */
  avatarSeed?: string;

  biography: string;
  /** One-line hero subtitle; falls back to the first sentence of `biography` when omitted. */
  shortBio?: string;
  career: PersonCareerEntry[];
  education?: PersonEducationEntry[];

  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;

  officialWebsite?: string;
  social?: PersonSocialLinks;

  relatedPeople?: RelatedPerson[];
  relatedOrganizations?: RelatedOrganization[];
  relatedWorks?: RelatedWork[];

  /** Manually curated for now — /people/[slug] also live-matches the byline/mention index once wired. */
  relatedArticleSlugs?: string[];
  videos?: PersonMediaItem[];
  interviews?: PersonMediaItem[];
  photos?: PersonMediaItem[];

  timeline?: PersonTimelineEntry[];

  seo?: PersonSeoFields;
  status: PersonStatus;
  verification: PersonVerification;

  /** Only set for `category: 'athletes'` (or anyone else with a real sporting career) — see PersonSportsInfo. */
  sportsInfo?: PersonSportsInfo;
}
