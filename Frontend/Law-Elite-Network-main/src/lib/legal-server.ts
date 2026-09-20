import { LEGAL_CASES } from '@/data/legal-cases';
import { COURTS } from '@/data/courts';
import { getRelatedArticles } from '@/lib/related-content';
import { fetchApiLegal } from '@/lib/legal-api';
import { overlay } from '@/lib/overlay';
import type { Court, LegalCase } from '@/types/legal';
import type { Person } from '@/types/person';
import type { EntityReference } from '@/types/entity-tagging';

/**
 * Cases and courts as the site shows them: the bundled set overlaid with what
 * editors manage in the admin panel (see overlay). If law-service is
 * unreachable the bundled set is served unchanged.
 */
export async function getMergedLegalCases(): Promise<LegalCase[]> {
  const api = await fetchApiLegal();
  return overlay(LEGAL_CASES, api.cases, api.hiddenCases);
}

export async function getMergedCourts(): Promise<Court[]> {
  const api = await fetchApiLegal();
  return overlay(COURTS, api.courts, api.hiddenCourts);
}

export async function getMergedLegalCaseBySlug(slug: string) {
  return (await getMergedLegalCases()).find((c) => c.slug === slug.toLowerCase()) ?? null;
}

export async function getMergedCourtBySlug(slug: string) {
  return (await getMergedCourts()).find((c) => c.slug === slug.toLowerCase()) ?? null;
}

export async function getMergedCasesForCourt(slug: string) {
  return (await getMergedLegalCases()).filter((c) => c.courtSlug === slug);
}

/** Every case a person appears on as a party, lawyer or judge. */
export async function getMergedLegalCasesForPerson(personSlug: string) {
  return (await getMergedLegalCases()).filter((c) => [...c.parties, ...c.lawyers, ...c.judges].some((p) => p.personSlug === personSlug));
}

const participantSlugs = (c: LegalCase) => Array.from(new Set([...c.parties, ...c.lawyers, ...c.judges].map((p) => p.personSlug).filter((s): s is string => !!s)));

/** Every person and the court this case is genuinely, explicitly connected to (its parties/lawyers/judges, its court). */
function getRelatedEntitiesForCase(legalCase: LegalCase): EntityReference[] {
  const refs: EntityReference[] = participantSlugs(legalCase).map((slug) => ({ entityType: 'person', slug }));
  refs.push({ entityType: 'court', slug: legalCase.courtSlug });
  return refs;
}

/**
 * Direct auto-detected mentions first, then articles connected to a party,
 * lawyer, judge, or the court — see @/lib/related-content.ts for the
 * relevance rule and dedup/cap logic.
 */
export async function getLatestNewsForCase(legalCase: LegalCase): Promise<any[]> {
  return getRelatedArticles('legal-case', legalCase.slug, {
    relatedEntities: getRelatedEntitiesForCase(legalCase),
    manualSlugs: legalCase.relatedArticleSlugs,
  });
}

/** Direct auto-detected mentions first, then articles connected to any case heard at this court. */
export async function getLatestNewsForCourt(courtSlug: string): Promise<any[]> {
  const casesHere = (await getMergedCasesForCourt(courtSlug)).map((c): EntityReference => ({ entityType: 'legal-case', slug: c.slug }));
  return getRelatedArticles('court', courtSlug, { relatedEntities: casesHere });
}

/** Resolved Person profiles for a case's parties/lawyers/judges, keyed by slug — an unresolved personSlug is just omitted. */
export function getResolvedCaseParticipants(legalCase: LegalCase, allPeople: Person[]) {
  const people = new Map(allPeople.map((p) => [p.slug, p]));
  const map = new Map<string, Person>();
  participantSlugs(legalCase).forEach((slug) => {
    const person = people.get(slug);
    if (person) map.set(slug, person);
  });
  return map;
}

export { getMergedLegalCasesForPerson as getLegalCasesForPerson };
