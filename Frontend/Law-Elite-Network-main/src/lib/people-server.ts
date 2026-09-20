import { PEOPLE } from '@/data/people';
import { fetchApiPeople } from '@/lib/people-api';
import { fetchApiHiddenPeople } from '@/lib/legal-api';
import { fetchEntityPhotos } from '@/lib/photos-api';
import { getRelatedArticles } from '@/lib/related-content';
import { getLegalCasesForPerson as getBundledCasesForPerson } from '@/data/legal-cases';
import { getMergedLegalCasesForPerson } from '@/lib/legal-server';
import type { LegalCase } from '@/types/legal';
import { getMergedSportsCompetitions } from '@/lib/sports-server';
import { getSportsCompetitionsForPerson as getBundledCompetitionsForPerson } from '@/data/sports-competitions';
import type { SportsCompetition } from '@/types/sports';
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
  const [api, hidden, photos] = await Promise.all([fetchApiPeople(), fetchApiHiddenPeople(), fetchEntityPhotos()]);
  const apiBySlug = new Map(api.map((p) => [p.slug, p]));
  // Admin-managed data overrides the bundled profile field by field (never
  // with a blank), and admin-only people are appended.
  const merged = PEOPLE.filter((p) => !hidden.has(p.slug)).map((bundled) => {
    const managed = apiBySlug.get(bundled.slug);
    if (!managed) return bundled;
    apiBySlug.delete(bundled.slug);
    const defined = Object.fromEntries(Object.entries(managed).filter(([, v]) => v !== undefined && v !== ''));
    return { ...bundled, ...defined, thin: undefined } as Person;
  });
  // A stored photo lights up the card and the profile; it does not make a stub any deeper, so `thin` is untouched.
  return [...merged, ...apiBySlug.values()].map((p) => {
    const photo = p.photo ?? photos.get(`person:${p.slug}`);
    return photo && !p.photo ? { ...p, photo, avatarUrl: p.avatarUrl ?? photo.url } : p;
  });
}

export async function getMergedPersonBySlug(slug: string): Promise<Person | null> {
  return (await getMergedPeople()).find((p) => p.slug === slug.toLowerCase()) ?? null;
}

export async function getMergedPeopleByCategory(category: PersonCategorySlug): Promise<Person[]> {
  return (await getMergedPeople()).filter((p) => p.category === category);
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
export function getRelatedEntitiesForPerson(person: Person, cases?: LegalCase[], competitions?: SportsCompetition[]): EntityReference[] {
  const refs: EntityReference[] = [];

  person.relatedPeople?.forEach((rel) => refs.push({ entityType: 'person', slug: rel.slug }));

  person.relatedWorks?.forEach((work) => {
    const entityType = work.entitySlug && RELATED_WORK_ENTITY_TYPE[work.type];
    if (entityType && work.entitySlug) refs.push({ entityType, slug: work.entitySlug });
  });

  (cases ?? getBundledCasesForPerson(person.slug)).forEach((c) => refs.push({ entityType: 'legal-case', slug: c.slug }));
  (competitions ?? getBundledCompetitionsForPerson(person.slug)).forEach((c) => refs.push({ entityType: 'sports-competition', slug: c.slug }));

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
    relatedEntities: getRelatedEntitiesForPerson(
      person,
      await getMergedLegalCasesForPerson(person.slug),
      (await getMergedSportsCompetitions()).filter((c) => c.peopleInvolved?.some((p) => p.personSlug === person.slug)),
    ),
    manualSlugs: person.relatedArticleSlugs,
  });
}

/** The athletes tied to a team through their sports info (admin-managed teams get their roster the same way as built-in ones). */
export async function getMergedAthletesForTeam(teamSlug: string): Promise<Person[]> {
  return (await getMergedPeople()).filter((p) => p.sportsInfo?.teamSlug === teamSlug);
}
