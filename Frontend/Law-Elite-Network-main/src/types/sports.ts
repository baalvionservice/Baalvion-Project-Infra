/**
 * @fileOverview LEN Sports — Team and Competition entities. Athletes are NOT
 * a new entity: they're existing Person profiles (`category: 'athletes'`)
 * with an optional `sportsInfo` block (see @/types/person.ts). This file
 * only covers what genuinely needs its own identity beyond a person: a team
 * multiple athletes belong to, and a competition/event multiple athletes
 * compete in.
 *
 * Deliberately minimal — identity + description + who's involved, no
 * rosters, schedules, standings, or live scores. Extensible: a `Team` or
 * `Competition` gains new fields the same way Court/EntertainmentEntity did,
 * without a breaking change to what already exists.
 */

import type { MediaItem } from './media';

/**
 * Not a closed enum -- sports are numerous and this list must stay
 * extensible (any string is valid on Person.sportsInfo.sport); this is only
 * a starting set for building a filter UI.
 */
export const COMMON_SPORTS = [
  'Basketball', 'American Football', 'Football (Soccer)', 'Baseball', 'Tennis',
  'Golf', 'Athletics', 'Swimming', 'Boxing', 'Motorsport', 'Cricket', 'Other',
] as const;

export interface SportsTeamVerification {
  verified: boolean;
  sourceNote?: string;
}

export interface SportsTeam {
  /** URL slug — /sports/teams/{slug}. */
  slug: string;
  name: string;
  sport: string;
  countryCode?: string;
  description: string;
  url?: string;
  verification: SportsTeamVerification;
  /** Explicit override from the admin panel; bundled teams are indexable. */
  indexable?: boolean;
}

export const COMPETITION_LEVELS = ['olympic', 'championship', 'tournament', 'league', 'other'] as const;
export type CompetitionLevel = (typeof COMPETITION_LEVELS)[number];

/** Same shape as EntertainmentPersonInvolvement — an athlete's participation in a competition, with an optional result. */
export interface CompetitionParticipant {
  personSlug: string;
  role: string;
  result?: string;
}

export interface SportsCompetition {
  /** URL slug — /sports/competitions/{slug}. */
  slug: string;
  name: string;
  sport: string;
  level: CompetitionLevel;
  countryCode?: string;
  description: string;
  date?: string;
  peopleInvolved?: CompetitionParticipant[];
  relatedArticleSlugs?: string[];
  videos?: MediaItem[];
  verification: SportsTeamVerification;
  /** Explicit override from the admin panel; bundled competitions are indexable. */
  indexable?: boolean;
}
