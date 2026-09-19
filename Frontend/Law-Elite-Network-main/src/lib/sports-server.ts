import { SPORTS_TEAMS, getSportsTeamBySlug } from '@/data/sports-teams';
import { SPORTS_COMPETITIONS, getSportsCompetitionBySlug, getSportsCompetitionsForPerson } from '@/data/sports-competitions';
import { getAllPeople } from '@/data/people';
import { getRelatedArticles } from '@/lib/related-content';
import type { SportsCompetition } from '@/types/sports';
import type { EntityReference } from '@/types/entity-tagging';

/**
 * Server-side sports directory — bundled only for now, shaped exactly like
 * the People/Entertainment/Legal merge layers. No CMS `teams`/`competitions`
 * tables exist yet; a future one slots in here the same way.
 */
export async function getMergedSportsTeams() {
  return SPORTS_TEAMS;
}

export async function getMergedSportsTeamBySlug(slug: string) {
  return getSportsTeamBySlug(slug);
}

export async function getMergedSportsCompetitions() {
  return SPORTS_COMPETITIONS;
}

export async function getMergedSportsCompetitionBySlug(slug: string) {
  return getSportsCompetitionBySlug(slug);
}

export { getSportsCompetitionsForPerson };

/** Direct auto-detected mentions first, then articles connected to a competing athlete — see @/lib/related-content.ts. */
export async function getLatestNewsForCompetition(competition: SportsCompetition): Promise<any[]> {
  const athletes: EntityReference[] = (competition.peopleInvolved || []).map((p) => ({ entityType: 'person', slug: p.personSlug }));
  return getRelatedArticles('sports-competition', competition.slug, {
    relatedEntities: athletes,
    manualSlugs: competition.relatedArticleSlugs,
  });
}

/** Direct auto-detected mentions first, then articles connected to an athlete on the team. */
export async function getLatestNewsForTeam(teamSlug: string): Promise<any[]> {
  const athletes: EntityReference[] = getAllPeople()
    .filter((p) => p.sportsInfo?.teamSlug === teamSlug)
    .map((p) => ({ entityType: 'person', slug: p.slug }));
  return getRelatedArticles('sports-team', teamSlug, { relatedEntities: athletes });
}
