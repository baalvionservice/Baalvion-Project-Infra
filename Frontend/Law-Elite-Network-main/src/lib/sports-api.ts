import { fetchPublicApi } from '@/lib/api/public-fetch';
import type { CompetitionLevel, CompetitionParticipant, SportsCompetition, SportsTeam } from '@/types/sports';
import type { MediaItem } from '@/types/media';

interface ApiTeam { slug: string; name: string; sport: string; country_code?: string | null; description?: string; url?: string | null; verified?: boolean; source_note?: string | null; indexable?: boolean }
interface ApiCompetition {
  slug: string; name: string; sport: string; level: CompetitionLevel; country_code?: string | null; description?: string; event_date?: string | null;
  people_involved?: CompetitionParticipant[]; related_article_slugs?: string[]; videos?: MediaItem[]; verified?: boolean; source_note?: string | null; indexable?: boolean;
}

const orUndef = <T,>(v: T | null | undefined) => (v == null || v === '' ? undefined : v);
const listOrUndef = <T,>(v: T[] | undefined) => (v && v.length ? v : undefined);
const rows = <T,>(json: any): T[] => (Array.isArray(json?.data) ? (json.data as T[]) : []);

const toTeam = (t: ApiTeam): SportsTeam => ({
  slug: t.slug, name: t.name, sport: t.sport, countryCode: orUndef(t.country_code), description: t.description ?? '', url: orUndef(t.url),
  verification: { verified: !!t.verified, sourceNote: orUndef(t.source_note) }, indexable: t.indexable,
});

const toCompetition = (c: ApiCompetition): SportsCompetition => ({
  slug: c.slug, name: c.name, sport: c.sport, level: c.level, countryCode: orUndef(c.country_code), description: c.description ?? '', date: orUndef(c.event_date),
  peopleInvolved: listOrUndef(c.people_involved), relatedArticleSlugs: listOrUndef(c.related_article_slugs), videos: listOrUndef(c.videos),
  verification: { verified: !!c.verified, sourceNote: orUndef(c.source_note) }, indexable: c.indexable,
});

/** Admin-managed teams and competitions plus the slugs an editor archived. Empty when law-service is unreachable, so the site serves its bundled entries. */
export async function fetchApiSports() {
  const [teams, competitions, hidden] = await Promise.all([fetchPublicApi('/sports/teams'), fetchPublicApi('/sports/competitions'), fetchPublicApi('/sports/hidden')]);
  return {
    teams: rows<ApiTeam>(teams).map(toTeam),
    competitions: rows<ApiCompetition>(competitions).map(toCompetition),
    hiddenTeams: new Set<string>(hidden?.data?.teams ?? []),
    hiddenCompetitions: new Set<string>(hidden?.data?.competitions ?? []),
  };
}
