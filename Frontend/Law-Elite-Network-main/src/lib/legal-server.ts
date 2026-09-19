import { LEGAL_CASES, getLegalCaseBySlug, getLegalCasesForPerson, getCaseParticipantSlugs, getLegalCasesByCourt } from '@/data/legal-cases';
import { COURTS, getCourtBySlug } from '@/data/courts';
import { getPersonBySlug } from '@/data/people';
import { getRelatedArticles } from '@/lib/related-content';
import type { LegalCase } from '@/types/legal';
import type { EntityReference } from '@/types/entity-tagging';

/**
 * Server-side legal directory — bundled only for now, shaped exactly like
 * people-server.ts and entertainment-server.ts's merge layers. No CMS
 * `cases`/`courts` tables exist yet; a future one slots in here the same
 * way, without touching any caller.
 */
export async function getMergedLegalCases(): Promise<LegalCase[]> {
  return LEGAL_CASES;
}

export async function getMergedLegalCaseBySlug(slug: string) {
  return getLegalCaseBySlug(slug);
}

export async function getMergedCourts() {
  return COURTS;
}

export async function getMergedCourtBySlug(slug: string) {
  return getCourtBySlug(slug);
}

export async function getMergedCasesForCourt(slug: string) {
  return getLegalCasesByCourt(slug);
}

/** Every person and the court this case is genuinely, explicitly connected to (its parties/lawyers/judges, its court). */
function getRelatedEntitiesForCase(legalCase: LegalCase): EntityReference[] {
  const refs: EntityReference[] = getCaseParticipantSlugs(legalCase).map((slug) => ({ entityType: 'person', slug }));
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
  const casesHere = getLegalCasesByCourt(courtSlug).map((c): EntityReference => ({ entityType: 'legal-case', slug: c.slug }));
  return getRelatedArticles('court', courtSlug, { relatedEntities: casesHere });
}

/** Resolved Person profiles for a case's parties/lawyers/judges, keyed by slug — an unresolved personSlug is just omitted. */
export function getResolvedCaseParticipants(legalCase: LegalCase) {
  const map = new Map();
  getCaseParticipantSlugs(legalCase).forEach((slug) => {
    const person = getPersonBySlug(slug);
    if (person) map.set(slug, person);
  });
  return map;
}

export { getLegalCasesForPerson };
