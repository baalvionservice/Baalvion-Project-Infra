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
  {
    id: 'lc-2026-001',
    slug: 'california-ai-likeness-right-of-publicity-2026',
    title: 'California AB 2602 — AI-Generated Replica Consent & Right of Publicity',
    jurisdiction: 'California, United States',
    topic: 'Artificial Intelligence / Entertainment Law',
    effectiveDate: '2025-01-01',
    summary:
      'California AB 2602 prohibits studios and employers from using artificial intelligence to replicate a performer\'s voice, face, or likeness in a digital replica without explicit written consent, even when original contract language grants broad intellectual property rights.',
    changes: [
      {
        before: 'Broad "work for hire" clauses in talent contracts were interpreted to allow unlimited AI replication of recorded performances.',
        after: 'Requires a separate, explicit written consent clause specifically authorizing AI digital replica creation, negotiated and agreed to at or after the time the replica is created.',
        note: 'Applies to film, television, music, video games, and any commercial digital production.',
      },
    ],
    whoIsAffected: 'Recording artists, film actors, voice actors, broadcasters, video game studios, AI technology companies producing synthetic media.',
    officialSource: [
      { label: 'California AB 2602 (2024) — Legislative Counsel Digest', url: 'https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2602' },
    ],
    relatedGuideSlugs: ['hollywood-studio-arbitration-sag-aftra-ai-likeness-rights', 'tom-hanks-ai-likeness-copyright-enforcement-sag-aftra'],
  },
  {
    id: 'lc-2026-002',
    slug: 'ncaa-nil-house-v-ncaa-settlement-2026',
    title: 'House v. NCAA Settlement — NIL Revenue Sharing & Athlete Compensation Reform',
    jurisdiction: 'United States (Federal — NCAA)',
    topic: 'Sports Law / Name, Image & Likeness (NIL)',
    effectiveDate: '2025-07-01',
    summary:
      'The landmark House v. NCAA settlement approved by a federal court establishes a revenue-sharing framework requiring NCAA member schools to directly share approximately $22 million annually with student-athletes for use of their name, image, and likeness in broadcast media.',
    changes: [
      {
        before: 'NCAA amateurism rules prohibited direct institutional compensation to student-athletes for broadcast media, videogame, or commercial appearances.',
        after: 'Schools may share up to ~$22M/year in revenue directly with athletes. NCAA lifts restrictions on school-facilitated NIL deals subject to disclosure rules.',
        note: 'Retroactive damages of approximately $2.8 billion distributed to former athletes dating back to 2016.',
      },
    ],
    whoIsAffected: 'All Division I student-athletes, NCAA member institutions, athletic conferences, and collegiate sports broadcast rights holders.',
    officialSource: [
      { label: 'House v. NCAA, Case No. 4:20-cv-03919 (N.D. Cal. 2024) Settlement', url: 'https://www.courtlistener.com/docket/17312520/house-v-national-collegiate-athletic-association/' },
    ],
    relatedGuideSlugs: ['lebron-james-springhill-company-nil-regulations-klutch-sports'],
  },
  {
    id: 'lc-2026-003',
    slug: 'corporate-transparency-act-boi-reporting-2026',
    title: 'Corporate Transparency Act — Beneficial Ownership Information (BOI) Reporting',
    jurisdiction: 'United States (Federal)',
    topic: 'Business & Corporate Law / Financial Compliance',
    effectiveDate: '2024-01-01',
    summary:
      'The Corporate Transparency Act (CTA), enforced by FinCEN under the Anti-Money Laundering Act of 2020, requires most U.S. small corporations and LLCs to file Beneficial Ownership Information reports disclosing ultimate individual owners holding 25%+ equity or exercising substantial control.',
    changes: [
      {
        before: 'No federal requirement to disclose beneficial ownership for shell companies, LLCs, or closely-held corporations formed under state law.',
        after: 'All covered reporting companies must file BOI reports with FinCEN identifying each beneficial owner by full legal name, date of birth, residential address, and government-issued ID.',
        note: 'Companies formed before January 1, 2024 had until January 1, 2025. New companies after that date must file within 30 days of formation.',
      },
    ],
    whoIsAffected: 'U.S. corporations, LLCs, limited partnerships, business trusts, and foreign entities registered to do business in the United States (with limited exemptions for large companies and regulated entities).',
    officialSource: [
      { label: 'FinCEN Beneficial Ownership Information Reporting Rule', url: 'https://www.fincen.gov/boi' },
    ],
    relatedGuideSlugs: [],
  },
];

export function getAllLawChanges(): LawChange[] {
  return LAW_CHANGES;
}

export function getLawChangeBySlug(slug: string): LawChange | null {
  return LAW_CHANGES.find((c) => c.slug === slug) ?? null;
}
