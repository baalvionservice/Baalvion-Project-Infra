/**
 * @fileOverview LEN entity-tagging system — the layer that lets one article
 * connect to many entities across every system built so far (People,
 * Entertainment, Legal, Sports, Countries, Topics) without an editor
 * duplicating the article onto each profile by hand.
 *
 * "Lawyers"/"Judges"/"Athletes" are not separate entity types here — they're
 * Person profiles (see @/types/person.ts's categories), so tagging a lawyer
 * IS tagging a person. Same for "Movies"/"TV shows"/"Music": all
 * EntertainmentEntity. "Events" splits across EntertainmentEntity's `event`
 * type and SportsCompetition, rather than getting a third type — an event is
 * always already one of those two kinds of thing.
 */

export const ENTITY_TYPES = [
  'person',
  'entertainment',
  'legal-case',
  'court',
  'sports-team',
  'sports-competition',
  'country',
  'topic',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

/** One pointer: which system, which record. This is the whole "connection" — an article's connection list is just EntityReference[]. */
export interface EntityReference {
  entityType: EntityType;
  slug: string;
}
