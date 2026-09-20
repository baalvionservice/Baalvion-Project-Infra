import { getAllPeople } from '@/data/people';
import { getAllEntertainmentEntities } from '@/data/entertainment';
import { getAllLegalCases } from '@/data/legal-cases';
import { getAllCourts } from '@/data/courts';
import { getAllSportsTeams } from '@/data/sports-teams';
import { getAllSportsCompetitions } from '@/data/sports-competitions';
import { getAllTopics } from '@/data/topics';
import type { Topic } from '@/data/topics';
import { COUNTRIES } from '@/lib/countries';
import type { EntityType } from '@/types/entity-tagging';
import type { Person } from '@/types/person';
import type { Court, LegalCase } from '@/types/legal';
import type { EntertainmentEntity } from '@/types/entertainment';
import type { SportsCompetition, SportsTeam } from '@/types/sports';

export interface EntityRegistryEntry {
  entityType: EntityType;
  slug: string;
  /** Every name/alias the tagging engine will match against article text. */
  names: string[];
}

/**
 * "Engler v. Winfrey (Texas Beef Group v. Winfrey)" should also match an
 * article that only says "Texas Beef Group v. Winfrey" or just "Engler v.
 * Winfrey" -- splits a "Primary (Alias)" name into both parts instead of
 * only ever matching the full compound string verbatim.
 */
function withParentheticalAlias(name: string): string[] {
  const match = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!match) return [name];
  return [match[1].trim(), match[2].trim()];
}

/**
 * One flat, searchable list of every taggable entity across every LEN
 * system — People, Entertainment, Legal, Sports, Countries, Topics. This is
 * the thing @/lib/entity-mentions.ts matches article text against; adding a
 * new taggable system means adding one block here, nothing else changes.
 *
 * Built fresh per call (all sources are small, static, in-memory arrays —
 * rebuilding is cheap; callers that need it cached wrap it, same as
 * unstable_cache wraps @/lib/entity-mentions.ts's article index).
 */
export function buildEntityRegistry(
  people: Person[] = getAllPeople(),
  legal: { cases: LegalCase[]; courts: Court[] } = { cases: getAllLegalCases(), courts: getAllCourts() },
  entertainment: EntertainmentEntity[] = getAllEntertainmentEntities(),
  sports: { teams: SportsTeam[]; competitions: SportsCompetition[] } = { teams: getAllSportsTeams(), competitions: getAllSportsCompetitions() },
  topics: Topic[] = getAllTopics(),
): EntityRegistryEntry[] {
  const entries: EntityRegistryEntry[] = [];

  people.forEach((p) => {
    const names = [p.displayName, p.fullName].filter((n): n is string => Boolean(n));
    entries.push({ entityType: 'person', slug: p.slug, names });
  });

  entertainment.forEach((e) => {
    entries.push({ entityType: 'entertainment', slug: e.slug, names: [e.title] });
  });

  legal.cases.forEach((c) => {
    entries.push({ entityType: 'legal-case', slug: c.slug, names: withParentheticalAlias(c.caseName) });
  });

  legal.courts.forEach((c) => {
    entries.push({ entityType: 'court', slug: c.slug, names: withParentheticalAlias(c.name) });
  });

  sports.teams.forEach((t) => {
    entries.push({ entityType: 'sports-team', slug: t.slug, names: withParentheticalAlias(t.name) });
  });

  sports.competitions.forEach((c) => {
    entries.push({ entityType: 'sports-competition', slug: c.slug, names: withParentheticalAlias(c.name) });
  });

  COUNTRIES.forEach((c) => {
    entries.push({ entityType: 'country', slug: c.code, names: [c.name] });
  });

  topics.forEach((t) => {
    entries.push({ entityType: 'topic', slug: t.slug, names: [t.name, ...(t.aliases || [])] });
  });

  return entries;
}
