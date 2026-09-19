import { getPersonBySlug } from '@/data/people';
import { getEntertainmentEntityBySlug } from '@/data/entertainment';
import { getLegalCaseBySlug } from '@/data/legal-cases';
import { getCourtBySlug } from '@/data/courts';
import { getSportsTeamBySlug } from '@/data/sports-teams';
import { getSportsCompetitionBySlug } from '@/data/sports-competitions';
import { getTopicBySlug } from '@/data/topics';
import { countryNameByCode } from '@/lib/countries';
import { personUrl } from '@/lib/person-url';
import { entertainmentUrl } from '@/lib/entertainment-url';
import { legalCaseUrl, courtUrl } from '@/lib/legal-case-url';
import { teamUrl, competitionUrl } from '@/lib/sports-url';
import { countryUrl } from '@/lib/country-url';
import { topicUrl } from '@/lib/topic-url';
import type { EntityReference } from '@/types/entity-tagging';

export interface ResolvedEntityReference extends EntityReference {
  name: string;
  url: string;
}

/**
 * The one place that turns an EntityReference (just {entityType, slug}) into
 * a real display name and URL, keyed by type -- used to render the
 * "Connections" list on an article page. Returns null for a slug that no
 * longer resolves (e.g. an entity later removed) rather than a broken link.
 */
export function resolveEntityReference(ref: EntityReference): ResolvedEntityReference | null {
  switch (ref.entityType) {
    case 'person': {
      const p = getPersonBySlug(ref.slug);
      return p ? { ...ref, name: p.displayName || p.fullName, url: personUrl(p.slug) } : null;
    }
    case 'entertainment': {
      const e = getEntertainmentEntityBySlug(ref.slug);
      return e ? { ...ref, name: e.title, url: entertainmentUrl(e.slug) } : null;
    }
    case 'legal-case': {
      const c = getLegalCaseBySlug(ref.slug);
      return c ? { ...ref, name: c.caseName, url: legalCaseUrl(c.slug) } : null;
    }
    case 'court': {
      const c = getCourtBySlug(ref.slug);
      return c ? { ...ref, name: c.name, url: courtUrl(c.slug) } : null;
    }
    case 'sports-team': {
      const t = getSportsTeamBySlug(ref.slug);
      return t ? { ...ref, name: t.name, url: teamUrl(t.slug) } : null;
    }
    case 'sports-competition': {
      const c = getSportsCompetitionBySlug(ref.slug);
      return c ? { ...ref, name: c.name, url: competitionUrl(c.slug) } : null;
    }
    case 'country': {
      const name = countryNameByCode(ref.slug);
      return name ? { ...ref, name, url: countryUrl(ref.slug) } : null;
    }
    case 'topic': {
      const t = getTopicBySlug(ref.slug);
      return t ? { ...ref, name: t.name, url: topicUrl(t.slug) } : null;
    }
    default:
      return null;
  }
}

export function resolveEntityReferences(refs: EntityReference[]): ResolvedEntityReference[] {
  return refs.map(resolveEntityReference).filter((r): r is ResolvedEntityReference => r !== null);
}
