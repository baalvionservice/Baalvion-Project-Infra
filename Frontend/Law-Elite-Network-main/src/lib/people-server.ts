import { PEOPLE, getPersonBySlug } from '@/data/people';
import { getRelatedArticles } from '@/lib/related-content';
import { getLegalCasesForPerson } from '@/data/legal-cases';
import { getSportsCompetitionsForPerson } from '@/data/sports-competitions';
import type { Person, PersonCategorySlug } from '@/types/person';
import type { EntityReference } from '@/types/entity-tagging';

/**
 * Server-side people directory — bundled only for now, shaped the same way
 * @/lib/authors-server.ts merges bundled + CMS authors. No CMS `people`
 * endpoint exists yet (cms-service has no person/entity table — see the LEN
 * IA notes), so this is a thin pass-through today; once one exists, wire it
 * in here the same way `fromCms()` does for authors, without touching any
 * caller (`/people`, `/people/[slug]`) below.
 */
export async function getMergedPeople(): Promise<Person[]> {
  return PEOPLE;
}

export async function getMergedPersonBySlug(slug: string): Promise<Person | null> {
  return getPersonBySlug(slug);
}

export async function getMergedPeopleByCategory(category: PersonCategorySlug): Promise<Person[]> {
  return PEOPLE.filter((p) => p.category === category);
}

const RELATED_WORK_ENTITY_TYPE: Partial<Record<NonNullable<Person['relatedWorks']>[number]['type'], EntityReference['entityType']>> = {
  movie: 'entertainment', show: 'entertainment', album: 'entertainment', song: 'entertainment', team: 'sports-team',
};

/**
 * Every other entity this person is genuinely, explicitly connected to —
 * the relationship graph a person's related content draws on. Every source
 * here is a real, already-modeled relationship (co-star/related person,
 * a linked movie/team, a case they're a party/lawyer/judge on, a
 * competition they competed in), not a guess.
 */
function getRelatedEntitiesForPerson(person: Person): EntityReference[] {
  const refs: EntityReference[] = [];

  person.relatedPeople?.forEach((rel) => refs.push({ entityType: 'person', slug: rel.slug }));

  person.relatedWorks?.forEach((work) => {
    const entityType = work.entitySlug && RELATED_WORK_ENTITY_TYPE[work.type];
    if (entityType && work.entitySlug) refs.push({ entityType, slug: work.entitySlug });
  });

  getLegalCasesForPerson(person.slug).forEach((c) => refs.push({ entityType: 'legal-case', slug: c.slug }));
  getSportsCompetitionsForPerson(person.slug).forEach((c) => refs.push({ entityType: 'sports-competition', slug: c.slug }));

  return refs;
}

/**
 * A person's related articles: direct auto-detected mentions first (see the
 * LEN entity-tagging system), then articles connected to an explicitly
 * related entity (co-stars, cases, competitions) filling any remaining
 * slots — see @/lib/related-content.ts for the relevance rule and
 * dedup/cap logic. No editor has to duplicate an article onto a profile for
 * it to show up here.
 */
export async function getLatestNewsForPerson(person: Person): Promise<any[]> {
  return getRelatedArticles('person', person.slug, {
    relatedEntities: getRelatedEntitiesForPerson(person),
    manualSlugs: person.relatedArticleSlugs,
  });
}
