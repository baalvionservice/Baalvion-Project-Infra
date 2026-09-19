/**
 * @fileOverview LEN Legal — Court and LegalCase entities completing the
 * "Celebrity → Legal Case → Court → Lawyer → Articles" chain. Lawyers and
 * judges are NOT a new type — they're existing Person profiles
 * (@/types/person.ts's `lawyers`/`judges` categories); a Case just references
 * them by slug, same pattern EntertainmentEntity.peopleInvolved uses.
 *
 * Factual/source-based only, and deliberately not a political database: no
 * election disputes, no cases framed around political parties or campaigns.
 * The seed cases (constitutional, consumer-protection, defamation/media law)
 * are chosen specifically to stay on the legal-doctrine side of that line.
 */

export const COURT_LEVELS = ['trial', 'appellate', 'supreme', 'international', 'other'] as const;
export type CourtLevel = (typeof COURT_LEVELS)[number];

export interface Court {
  /** URL slug — /legal/courts/{slug}. */
  slug: string;
  name: string;
  level: CourtLevel;
  countryCode?: string;
  description: string;
  /** Official court website, when one exists. */
  url?: string;
}

/**
 * One shape for every person connected to a case — a party, a lawyer, or a
 * judge — rather than three different record shapes. `personSlug` links to a
 * real @/data/people.ts profile when one exists; `name` alone (a government
 * office, an unprofiled individual) is equally valid so a case never needs a
 * fabricated Person profile just to name a participant.
 */
export interface CaseParticipant {
  name: string;
  personSlug?: string;
  /** Free text: "Plaintiff", "Defendant", "Lead Defense Counsel", "Presiding Judge", "Justice — authored majority opinion", etc. */
  role: string;
}

export const CASE_STATUSES = ['ongoing', 'concluded', 'settled', 'dismissed', 'appealed'] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export interface CaseImportantDate {
  /** ISO date, or just a year when the exact date isn't the relevant fact. */
  date: string;
  /** "Filed", "Trial began", "Verdict", "Appeal decided", etc. */
  label: string;
}

export interface CaseTimelineEntry {
  date: string;
  title: string;
  description?: string;
}

/** A judgment, ruling, filing, or other case document — only ever a real, hosted, publicly available source. */
export interface CaseDocument {
  title: string;
  url: string;
  /** "Opinion", "Complaint", "Ruling", "Verdict", etc. */
  type?: string;
}

export interface CaseSeoFields {
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath?: string;
}

export interface CaseVerification {
  verified: boolean;
  sourceNote?: string;
  lastReviewedAt?: string;
}

export interface LegalCase {
  /** URL slug — /legal/cases/{slug}. */
  slug: string;
  caseName: string;
  courtSlug: string;
  /** Free-text jurisdiction description, e.g. "United States — Federal", "Egypt". */
  jurisdiction: string;
  countryCode?: string;
  parties: CaseParticipant[];
  lawyers: CaseParticipant[];
  judges: CaseParticipant[];
  status: CaseStatus;
  importantDates: CaseImportantDate[];
  summary: string;
  documents?: CaseDocument[];
  timeline?: CaseTimelineEntry[];
  /** Manually curated for now, same interim approach as Person/EntertainmentEntity — resolved to real articles, never fabricated. */
  relatedArticleSlugs?: string[];
  seo?: CaseSeoFields;
  verification: CaseVerification;
}
