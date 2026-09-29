import { SPORTS_TEAMS } from '@/data/sports-teams';
import { SPORTS_COMPETITIONS } from '@/data/sports-competitions';
import { fetchApiSports } from '@/lib/sports-api';
import { overlay } from '@/lib/overlay';
import { getRelatedArticles } from '@/lib/related-content';
import type { SportsCompetition, SportsTeam } from '@/types/sports';
import type { EntityReference } from '@/types/entity-tagging';
import type { RelatedWork } from '@/types/person';

/**
 * Sports teams and competitions as the site shows them: the bundled set
 * overlaid with what editors manage in the admin panel (see overlay). If
 * law-service is unreachable the bundled set is served unchanged.
 */
export async function getMergedSportsTeams(): Promise<SportsTeam[]> {
  const api = await fetchApiSports();
  return overlay(SPORTS_TEAMS, api.teams, api.hiddenTeams);
}

export async function getMergedSportsTeamBySlug(slug: string) {
  return (await getMergedSportsTeams()).find((t) => t.slug === slug.toLowerCase()) ?? null;
}

export async function getMergedSportsCompetitions(): Promise<SportsCompetition[]> {
  const api = await fetchApiSports();
  return overlay(SPORTS_COMPETITIONS, api.competitions, api.hiddenCompetitions);
}

export async function getMergedSportsCompetitionBySlug(slug: string) {
  return (await getMergedSportsCompetitions()).find((c) => c.slug === slug.toLowerCase()) ?? null;
}

/** Every competition a person took part in. */
export async function getSportsCompetitionsForPerson(personSlug: string): Promise<SportsCompetition[]> {
  return (await getMergedSportsCompetitions()).filter((c) => c.peopleInvolved?.some((p) => p.personSlug === personSlug));
}

/**
 * A person's competitions as profile "works", derived from the competitions
 * that list them, so crediting an athlete never requires also editing their profile.
 */
export async function getCompetitionWorksForPerson(personSlug: string): Promise<RelatedWork[]> {
  return (await getSportsCompetitionsForPerson(personSlug)).map((c) => {
    const credit = c.peopleInvolved?.find((p) => p.personSlug === personSlug);
    return { title: c.name, type: 'sports-event' as const, year: c.date ? Number(c.date.slice(0, 4)) || undefined : undefined, role: [credit?.role, credit?.result].filter(Boolean).join(' · '), entitySlug: c.slug };
  });
}

/** Direct auto-detected mentions first, then articles connected to a competing athlete — see @/lib/related-content.ts. */
export async function getLatestNewsForCompetition(competition: SportsCompetition): Promise<any[]> {
  const athletes: EntityReference[] = (competition.peopleInvolved || []).map((p) => ({ entityType: 'person', slug: p.personSlug }));
  return getRelatedArticles('sports-competition', competition.slug, {
    relatedEntities: athletes,
    manualSlugs: competition.relatedArticleSlugs,
  });
}

/** Direct auto-detected mentions first, then articles connected to an athlete on the team (the caller supplies the athletes). */
export async function getLatestNewsForTeam(teamSlug: string, athletes: { slug: string }[]): Promise<any[]> {
  const refs: EntityReference[] = athletes.map((p) => ({ entityType: 'person', slug: p.slug }));
  return getRelatedArticles('sports-team', teamSlug, { relatedEntities: refs });
}
