/**
 * @fileOverview LEN Legal — bundled LegalCase entities. Chosen specifically
 * to demonstrate the Celebrity → Legal Case → Court → Lawyer → Articles
 * chain with real, source-based cases while staying off the political-party
 * side of the line the user drew ("do not create a political database"):
 * constitutional/equal-protection doctrine, consumer-protection contract
 * law, media/defamation law, and a press-freedom criminal appeal — no
 * election disputes, no case framed around a political party or campaign.
 *
 * Same content-integrity posture as people.ts/entertainment.ts: real,
 * long-settled or well-documented public record only. `documents` is left
 * empty everywhere -- no invented/unverified filing or opinion URLs -- and
 * `relatedArticleSlugs` is empty until a real published article actually
 * covers one of these.
 */

import type { LegalCase } from '@/types/legal';

export const LEGAL_CASES: LegalCase[] = [
  {
    slug: 'engler-v-winfrey',
    caseName: 'Engler v. Winfrey (Texas Beef Group v. Winfrey)',
    courtSlug: 'us-district-court-northern-district-of-texas',
    jurisdiction: 'United States — Federal',
    countryCode: 'US',
    parties: [
      { name: 'Paul F. Engler and other Texas cattle feeders (Texas Beef Group)', role: 'Plaintiffs' },
      { name: 'Oprah Winfrey', personSlug: 'oprah-winfrey', role: 'Defendant' },
    ],
    lawyers: [
      { name: 'Charles L. "Chip" Babcock', role: 'Lead defense counsel for Winfrey' },
    ],
    judges: [
      { name: 'Mary Lou Robinson', role: 'Presiding U.S. District Judge' },
    ],
    status: 'concluded',
    importantDates: [
      { date: '1996-05', label: 'Lawsuit filed' },
      { date: '1998-01-20', label: 'Trial began in Amarillo, Texas' },
      { date: '1998-02-26', label: 'Jury verdict in favor of Winfrey' },
      { date: '2000-01-11', label: 'Fifth Circuit affirms judgment for Winfrey' },
    ],
    summary:
      'A group of Texas cattle feeders sued Oprah Winfrey and a guest under Texas’s False Disparagement of Perishable Food Products Act after comments about mad cow disease on an April 1996 episode of The Oprah Winfrey Show were followed by a sharp drop in cattle futures prices. ' +
      'The case was tried before a jury in Amarillo, Texas in early 1998. The court dismissed the food-disparagement claim before it reached the jury, and the jury rejected the plaintiffs’ remaining business-disparagement claim, returning a verdict for Winfrey. The Fifth Circuit affirmed in 2000.',
    timeline: [
      { date: '1996-04-16', title: 'Broadcast at issue airs', description: 'A guest’s comments about mad cow disease risk are discussed on The Oprah Winfrey Show.' },
      { date: '1996-05', title: 'Lawsuit filed', description: 'Texas cattle feeders sue under the state’s food-disparagement statute and for business disparagement.' },
      { date: '1998-01-20', title: 'Trial begins', description: 'The case is tried before Judge Mary Lou Robinson in Amarillo, Texas.' },
      { date: '1998-02-26', title: 'Verdict', description: 'The jury returns a verdict in favor of Winfrey on the remaining claim.' },
      { date: '2000-01-11', title: 'Appeal decided', description: 'The Fifth Circuit affirms the judgment for Winfrey.' },
    ],
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry, not affiliated with any party or counsel.' },
    seo: { metaTitle: 'Engler v. Winfrey — Case Profile', metaDescription: 'Engler v. Winfrey (the "Oprah mad cow" trial): parties, court, verdict, and timeline.' },
  },
  {
    slug: 'united-states-v-virginia',
    caseName: 'United States v. Virginia',
    courtSlug: 'supreme-court-of-the-united-states',
    jurisdiction: 'United States — Federal',
    countryCode: 'US',
    parties: [
      { name: 'United States', role: 'Petitioner' },
      { name: 'Commonwealth of Virginia / Virginia Military Institute', role: 'Respondent' },
    ],
    lawyers: [],
    judges: [
      { name: 'Ruth Bader Ginsburg', personSlug: 'ruth-bader-ginsburg', role: 'Associate Justice — authored the majority opinion' },
    ],
    status: 'concluded',
    importantDates: [
      { date: '1996-01-17', label: 'Oral argument' },
      { date: '1996-06-26', label: 'Decision issued' },
    ],
    summary:
      'The Supreme Court held that the Virginia Military Institute’s male-only admissions policy violated the Equal Protection Clause of the Fourteenth Amendment. ' +
      'Justice Ruth Bader Ginsburg wrote the majority opinion, holding that Virginia had not shown an "exceedingly persuasive justification" for excluding women, and that a separate leadership-training program offered to women was not a genuine equivalent.',
    timeline: [
      { date: '1996-01-17', title: 'Oral argument heard' },
      { date: '1996-06-26', title: 'Decision issued', description: 'The Court rules 7-1 that VMI’s male-only admissions policy is unconstitutional.' },
    ],
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry.' },
    seo: { metaTitle: 'United States v. Virginia — Case Profile', metaDescription: 'United States v. Virginia (1996): the VMI case, parties, and Justice Ginsburg’s majority opinion.' },
  },
  {
    slug: 'marbury-v-madison',
    caseName: 'Marbury v. Madison',
    courtSlug: 'supreme-court-of-the-united-states',
    jurisdiction: 'United States — Federal',
    countryCode: 'US',
    parties: [
      { name: 'William Marbury', role: 'Plaintiff' },
      { name: 'James Madison, Secretary of State', role: 'Defendant' },
    ],
    lawyers: [],
    judges: [
      { name: 'John Marshall', role: 'Chief Justice — authored the opinion' },
    ],
    status: 'concluded',
    importantDates: [
      { date: '1803-02-24', label: 'Decision issued' },
    ],
    summary:
      'A foundational U.S. Supreme Court case establishing the principle of judicial review — the power of federal courts to strike down laws that conflict with the Constitution. ' +
      'The Court, in an opinion by Chief Justice John Marshall, held that a provision of the Judiciary Act of 1789 was unconstitutional, marking the first time the Court invalidated an act of Congress.',
    timeline: [
      { date: '1803-02-24', title: 'Decision issued', description: 'Chief Justice Marshall establishes the principle of judicial review.' },
    ],
    verification: { verified: true, sourceNote: 'Long-settled public record — independent reference entry.' },
    seo: { metaTitle: 'Marbury v. Madison — Case Profile', metaDescription: 'Marbury v. Madison (1803): the case that established judicial review.' },
  },
  {
    slug: 'carnival-cruise-lines-v-shute',
    caseName: 'Carnival Cruise Lines, Inc. v. Shute',
    courtSlug: 'supreme-court-of-the-united-states',
    jurisdiction: 'United States — Federal',
    countryCode: 'US',
    parties: [
      { name: 'Carnival Cruise Lines, Inc.', role: 'Petitioner' },
      { name: 'Eulala Shute et al.', role: 'Respondents' },
    ],
    lawyers: [],
    judges: [],
    status: 'concluded',
    importantDates: [
      { date: '1991-01-15', label: 'Oral argument' },
      { date: '1991-04-17', label: 'Decision issued' },
    ],
    summary:
      'The Supreme Court held that a forum-selection clause printed on a cruise ticket contract, requiring passengers to bring any lawsuit in a specific court, was enforceable even though the passenger had not separately negotiated it. ' +
      'This decision is why cruise lines’ ticket contracts today can, and typically do, require injury claims to be filed in one specific court regardless of where a passenger lives or boarded.',
    timeline: [
      { date: '1991-04-17', title: 'Decision issued', description: 'The Court upholds the enforceability of cruise-ticket forum-selection clauses.' },
    ],
    relatedArticleSlugs: [],
    verification: { verified: true, sourceNote: 'Long-settled public record — the same case already cited in this network’s Cruise Ship & Passenger Vessel Accidents hub.' },
    seo: { metaTitle: 'Carnival Cruise Lines, Inc. v. Shute — Case Profile', metaDescription: 'Carnival Cruise Lines, Inc. v. Shute (1991): the case behind cruise-ticket forum-selection clauses.' },
  },
  {
    slug: 'egypt-v-fahmy-and-mohamed',
    caseName: 'Egypt v. Fahmy and Mohamed (Al Jazeera journalists case)',
    courtSlug: 'cairo-criminal-court',
    jurisdiction: 'Egypt',
    countryCode: 'EG',
    parties: [
      { name: 'Arab Republic of Egypt', role: 'Prosecution' },
      { name: 'Mohamed Fahmy and Baher Mohamed', role: 'Defendants' },
    ],
    lawyers: [
      { name: 'Amal Clooney', personSlug: 'amal-clooney', role: 'International legal counsel for the defense' },
    ],
    judges: [],
    status: 'concluded',
    importantDates: [
      { date: '2014-06-23', label: 'Initial convictions' },
      { date: '2015-08-29', label: 'Retrial conviction' },
      { date: '2015-09-23', label: 'Presidential pardon' },
    ],
    summary:
      'Al Jazeera journalists Mohamed Fahmy and Baher Mohamed were prosecuted in Egypt on charges related to their reporting, in a case that drew international press-freedom criticism. ' +
      'Amal Clooney joined the legal team as international counsel during the appeal process. Both journalists were pardoned by Egyptian President Abdel Fattah el-Sisi in September 2015.',
    timeline: [
      { date: '2014-06-23', title: 'Initial convictions', description: 'Fahmy and Mohamed are convicted alongside a third journalist.' },
      { date: '2015-08-29', title: 'Retrial conviction', description: 'A retrial results in renewed convictions.' },
      { date: '2015-09-23', title: 'Presidential pardon', description: 'President Sisi pardons Fahmy, Mohamed, and other prisoners.' },
    ],
    verification: { verified: true, sourceNote: 'Widely reported public record — independent reference entry. Dates reflect the most commonly reported timeline; consult primary news sources for full procedural detail.' },
    seo: { metaTitle: 'Egypt v. Fahmy and Mohamed — Case Profile', metaDescription: 'The Al Jazeera journalists case: charges, international counsel, and outcome.' },
  },
  {
    slug: 'cristiano-ronaldo-v-juventus-arbitration',
    caseName: 'Cristiano Ronaldo v. Juventus Football Club S.p.A. (deferred-wage dispute)',
    courtSlug: 'turin-labour-court',
    jurisdiction: 'Italy',
    countryCode: 'IT',
    parties: [
      { name: 'Cristiano Ronaldo', personSlug: 'cristiano-ronaldo', role: 'Claimant' },
      { name: 'Juventus Football Club S.p.A.', role: 'Respondent' },
    ],
    lawyers: [],
    judges: [],
    status: 'concluded',
    importantDates: [
      { date: '2023-06', label: 'Ronaldo begins arbitration proceedings (as reported)' },
      { date: '2024-04', label: 'Arbitration tribunal awards Ronaldo about €9.7M' },
      { date: '2026-01-20', label: 'Turin Labour Court rejects Juventus’s appeal' },
    ],
    summary:
      'Cristiano Ronaldo claimed about €19.5 million from Juventus in wages deferred under pandemic-era salary agreements. ' +
      'An arbitration tribunal decided in April 2024 that he was owed about half of that, roughly €9.7 million plus interest. ' +
      'Juventus appealed to the Turin Labour Court, which rejected the appeal on 20 January 2026, so Ronaldo keeps the sum he had already received.',
    timeline: [
      { date: '2020-03', title: 'Wage deferral agreements', description: 'Juventus and its players agree to defer part of their salaries during the Covid-19 pandemic.' },
      { date: '2024-04', title: 'Arbitration award', description: 'The tribunal awards Ronaldo about €9.7 million, half of what he claimed.' },
      { date: '2026-01-20', title: 'Appeal rejected', description: 'The Turin Labour Court dismisses Juventus’s appeal.' },
    ],
    verification: { verified: false, sourceNote: 'Cross-checked against press reports (Fox Sports, Reuters-syndicated coverage, Goal). The arbitration tribunal’s exact name and the award document have not been located; needs primary-source confirmation before marking verified.' },
    seo: { metaTitle: 'Ronaldo v. Juventus Deferred-Wage Dispute — Case Profile', metaDescription: 'How Cristiano Ronaldo’s claim for deferred wages against Juventus was decided by arbitration and upheld on appeal.' },
  },

];

export function getAllLegalCases(): LegalCase[] {
  return LEGAL_CASES;
}

export function getLegalCaseBySlug(slug: string): LegalCase | null {
  const target = slug.toLowerCase();
  return LEGAL_CASES.find((c) => c.slug === target) ?? null;
}

export function getLegalCasesByCourt(courtSlug: string): LegalCase[] {
  return LEGAL_CASES.filter((c) => c.courtSlug === courtSlug);
}

/** Every case a person appears on as a party, lawyer, or judge — the reverse direction of those three arrays. */
export function getLegalCasesForPerson(personSlug: string): LegalCase[] {
  return LEGAL_CASES.filter((c) =>
    [...c.parties, ...c.lawyers, ...c.judges].some((p) => p.personSlug === personSlug),
  );
}

/** Every person with a resolvable profile connected to a case, deduped, across parties/lawyers/judges — "Related People" is computed, not a stored duplicate field. */
export function getCaseParticipantSlugs(legalCase: LegalCase): string[] {
  const slugs = new Set<string>();
  [...legalCase.parties, ...legalCase.lawyers, ...legalCase.judges].forEach((p) => {
    if (p.personSlug) slugs.add(p.personSlug);
  });
  return Array.from(slugs);
}
