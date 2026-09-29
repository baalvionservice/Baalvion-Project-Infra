import { getMergedPeople } from '@/lib/people-server';
import { getMergedLegalCases, getMergedCourts } from '@/lib/legal-server';
import { getMergedEntertainmentEntities } from '@/lib/entertainment-server';
import { getMergedSportsTeams, getMergedSportsCompetitions } from '@/lib/sports-server';
import { getMergedTopics } from '@/lib/topics-server';
import type { Topic } from '@/data/topics';
import { countryNameByCode } from '@/lib/countries';
import { personUrl } from '@/lib/person-url';
import { entertainmentUrl } from '@/lib/entertainment-url';
import { legalCaseUrl, courtUrl } from '@/lib/legal-case-url';
import { teamUrl, competitionUrl } from '@/lib/sports-url';
import { countryUrl } from '@/lib/country-url';
import { topicUrl } from '@/lib/topic-url';
import { getShowTaggingLookups } from '@/lib/videos-tagging';
import type { EntityReference } from '@/types/entity-tagging';
import type { Person } from '@/types/person';
import type { Court, LegalCase } from '@/types/legal';
import type { EntertainmentEntity } from '@/types/entertainment';
import type { SportsCompetition, SportsTeam } from '@/types/sports';

export interface ResolvedEntityReference extends EntityReference {
  name: string;
  url: string;
}

interface Lookups { showRefs: Map<string, { name: string; url: string }>; topics: Map<string, Topic>; people: Map<string, Person>; entertainment: Map<string, EntertainmentEntity>; teams: Map<string, SportsTeam>; competitions: Map<string, SportsCompetition>; cases: Map<string, LegalCase>; courts: Map<string, Court> }

/**
 * The one place that turns an EntityReference (just {entityType, slug}) into
 * a real display name and URL, keyed by type -- used to render the
 * "Connections" list on an article page. Returns null for a slug that no
 * longer resolves (e.g. an entity later removed) rather than a broken link.
 */
// Third AdSense-readiness retirement pass, 2026-09-25 (see
// category-slugs.ts's CURRENT_CATEGORY_SLUGS comment): person, entertainment,
// legal-case, court, sports-team, sports-competition, country, and topic all
// resolve to a hub under a now-retired pillar (/people, /entertainment,
// /legal, /sports, /countries, /topics all 301 to /) -- an article's
// "Connections" list would otherwise link straight into a redirect.
// video-show/show-person stay resolvable since Videos/Podcasts are still
// live. Restore this set alongside CURRENT_CATEGORY_SLUGS.
const RETIRED_ENTITY_TYPES = new Set<EntityReference['entityType']>([
  'person', 'entertainment', 'legal-case', 'court', 'sports-team', 'sports-competition', 'country', 'topic',
]);

function resolveWith(ref: EntityReference, lk: Lookups): ResolvedEntityReference | null {
  if (RETIRED_ENTITY_TYPES.has(ref.entityType)) return null;
  switch (ref.entityType) {
    case 'person': {
      const p = lk.people.get(ref.slug);
      return p ? { ...ref, name: p.displayName || p.fullName, url: personUrl(p.slug) } : null;
    }
    case 'entertainment': {
      const e = lk.entertainment.get(ref.slug);
      return e ? { ...ref, name: e.title, url: entertainmentUrl(e.slug) } : null;
    }
    case 'legal-case': {
      const c = lk.cases.get(ref.slug);
      return c ? { ...ref, name: c.caseName, url: legalCaseUrl(c.slug) } : null;
    }
    case 'court': {
      const c = lk.courts.get(ref.slug);
      return c ? { ...ref, name: c.name, url: courtUrl(c.slug) } : null;
    }
    case 'sports-team': {
      const t = lk.teams.get(ref.slug);
      return t ? { ...ref, name: t.name, url: teamUrl(t.slug) } : null;
    }
    case 'sports-competition': {
      const c = lk.competitions.get(ref.slug);
      return c ? { ...ref, name: c.name, url: competitionUrl(c.slug) } : null;
    }
    case 'country': {
      const name = countryNameByCode(ref.slug);
      return name ? { ...ref, name, url: countryUrl(ref.slug) } : null;
    }
    case 'topic': {
      const t = lk.topics.get(ref.slug);
      return t ? { ...ref, name: t.name, url: topicUrl(t.slug) } : null;
    }
    case 'video-show':
    case 'show-person': {
      const r = lk.showRefs.get(`${ref.entityType}:${ref.slug}`);
      return r ? { ...ref, ...r } : null;
    }
    default:
      return null;
  }
}

/** Resolves against the merged (bundled + admin-managed) people, cases and courts, so an editor-created entity links correctly. */
export async function resolveEntityReferences(refs: EntityReference[]): Promise<ResolvedEntityReference[]> {
  const [people, cases, courts, entertainment, teams, competitions, topics] = await Promise.all([getMergedPeople(), getMergedLegalCases(), getMergedCourts(), getMergedEntertainmentEntities(), getMergedSportsTeams(), getMergedSportsCompetitions(), getMergedTopics()]);
  const showRefs = await getShowTaggingLookups().catch(() => new Map<string, { name: string; url: string }>());
  const lk: Lookups = { showRefs, topics: new Map(topics.map((t) => [t.slug, t])), teams: new Map(teams.map((t) => [t.slug, t])), competitions: new Map(competitions.map((c) => [c.slug, c])), entertainment: new Map(entertainment.map((e) => [e.slug, e])), people: new Map(people.map((p) => [p.slug, p])), cases: new Map(cases.map((c) => [c.slug, c])), courts: new Map(courts.map((c) => [c.slug, c])) };
  return refs.map((r) => resolveWith(r, lk)).filter((r): r is ResolvedEntityReference => r !== null);
}
