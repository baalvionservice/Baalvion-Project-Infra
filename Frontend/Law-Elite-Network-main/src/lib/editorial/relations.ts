import { getRelatedEntitiesForPerson } from '@/lib/people-server';
import { keyOf } from '@/lib/editorial/analyze';
import type { Person } from '@/types/person';
import type { LegalCase } from '@/types/legal';
import type { EntertainmentEntity } from '@/types/entertainment';
import type { SportsCompetition } from '@/types/sports';
import type { EntityReference } from '@/types/entity-tagging';

/**
 * entity key -> keys of entities it is explicitly connected to. Every edge is
 * a relationship already modelled in the data (a case's court and participants,
 * a film's credited people, a competition's athletes, a person's co-stars and
 * works), so the "you might also mention" hints are never guesses. Edges are
 * made two-way so a mention of either end suggests the other.
 */
export function buildRelations(people: Person[], cases: LegalCase[], entertainment: EntertainmentEntity[], competitions: SportsCompetition[]): Map<string, string[]> {
  const rel = new Map<string, Set<string>>();
  const add = (from: EntityReference, to: EntityReference) => {
    const kf = keyOf(from); const kt = keyOf(to);
    if (kf === kt) return;
    (rel.get(kf) ?? rel.set(kf, new Set()).get(kf)!).add(kt);
  };
  const link = (a: EntityReference, b: EntityReference) => { add(a, b); add(b, a); };
  const person = (slug: string): EntityReference => ({ entityType: 'person', slug });

  people.forEach((p) => {
    const own = cases.filter((c) => [...c.parties, ...c.lawyers, ...c.judges].some((x) => x.personSlug === p.slug));
    getRelatedEntitiesForPerson(p, own).forEach((r) => link(person(p.slug), r));
    // Topics an editor tagged the profile with (admin panel) are relations too.
    p.topicSlugs?.forEach((t) => link(person(p.slug), { entityType: 'topic', slug: t }));
  });

  cases.forEach((c) => {
    const me: EntityReference = { entityType: 'legal-case', slug: c.slug };
    // One way: a case points to its court, but naming a court should not offer every case it ever heard.
    add(me, { entityType: 'court', slug: c.courtSlug });
    [...c.parties, ...c.lawyers, ...c.judges].forEach((x) => x.personSlug && link(me, person(x.personSlug)));
  });

  entertainment.forEach((e) => {
    const me: EntityReference = { entityType: 'entertainment', slug: e.slug };
    e.peopleInvolved?.forEach((x) => link(me, person(x.personSlug)));
    e.relatedEntities?.forEach((x) => link(me, { entityType: 'entertainment', slug: x.slug }));
  });

  competitions.forEach((c) => {
    const me: EntityReference = { entityType: 'sports-competition', slug: c.slug };
    c.peopleInvolved?.forEach((x) => link(me, person(x.personSlug)));
  });

  return new Map([...rel].map(([k, v]) => [k, [...v]]));
}
