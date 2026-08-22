/**
 * @fileOverview Law Changes tracker -- analytical "what changed" entries,
 * distinct from the citation-index-backed /case-law and /legislation pages
 * (those aggregate statutes/cases already cited across guides; this is new
 * before/after analysis of a specific real regulatory change).
 *
 * Not a live feed: there's no bill-tracking or court-monitoring data source
 * wired into this site, so entries here are added one at a time, each
 * researched and source-verified the same way a guide's citations are --
 * never generated or inferred. `changes[].before`/`after` and `effectiveDate`
 * must be traceable to `officialSource` before an entry is added here.
 */

export interface LawChange {
  id: string;
  slug: string;
  title: string;
  jurisdiction: string;
  topic: string;
  /** ISO date the change takes (or took) legal effect. */
  effectiveDate: string;
  summary: string;
  changes: { before: string; after: string; note?: string }[];
  whoIsAffected: string;
  officialSource: { label: string; url: string }[];
  /** Slugs of existing guide articles discussing the underlying topic. */
  relatedGuideSlugs: string[];
}

export const LAW_CHANGES: LawChange[] = [
  {
    id: 'uk-employment-rights-act-2025',
    slug: 'uk-employment-rights-act-2025',
    title: 'UK Employment Law: What the Employment Rights Act 2025 Changes',
    jurisdiction: 'United Kingdom',
    topic: 'Employment & Labor',
    effectiveDate: '2027-01-01',
    summary:
      'The Employment Rights Act 2025 makes several major changes to UK dismissal law. Some provisions are already in force; the largest ones -- the shorter unfair-dismissal qualifying period and the fire-and-rehire restriction -- are set to take effect on 1 January 2027.',
    changes: [
      {
        before: 'An employee generally needed 2 years’ continuous service before they could bring an unfair dismissal claim.',
        after: 'Protection from unfair dismissal becomes a "day one" style right after only 6 months’ service.',
        note: 'Takes effect 1 January 2027.',
      },
      {
        before: 'Dismissing an employee and rehiring them on worse terms ("fire and rehire") was generally lawful if the employer followed a fair process and had a genuine business reason.',
        after: 'Fire and rehire becomes automatically unfair dismissal in most cases.',
        note: 'Takes effect 1 January 2027.',
      },
      {
        before: 'Dismissal for taking part in industrial action was only protected from an unfair dismissal claim within a 12-week limit.',
        after: 'Dismissal for taking part in industrial action is automatically unfair, with no 12-week limit.',
        note: 'Already in force from 18 February 2026.',
      },
    ],
    whoIsAffected: 'Employers and employees in England, Wales, and Scotland. The shortened qualifying period and fire-and-rehire restriction affect how employers can lawfully dismiss or renegotiate terms with newer employees; the industrial-action change affects employees who take part in official industrial action.',
    officialSource: [
      { label: 'Employment Rights Act 2025 (UK Public General Acts, c. 36)', url: 'https://www.legislation.gov.uk/ukpga/2025/36' },
      { label: 'Acas, Employment Rights Act 2025', url: 'https://www.acas.org.uk/employment-rights-act-2025' },
    ],
    relatedGuideSlugs: ['unfair-dismissal-uk-guide'],
  },
];

export function getAllLawChanges(): LawChange[] {
  return LAW_CHANGES;
}

export function getLawChangeBySlug(slug: string): LawChange | null {
  return LAW_CHANGES.find((c) => c.slug === slug) ?? null;
}
