import type { LegalKeyTerm } from '@/components/knowledge/KeyLegalTerms';

/**
 * Per-category glossary terms for the practice-area page's Key Legal Terms
 * widget. Definitions are paraphrased from (and every `href` points into)
 * the network's own published guides — most concentrated in
 * /personal-injury-lawyer/maritime-offshore-accident-law-glossary, the
 * site's real, already-live glossary article — rather than written fresh,
 * so nothing here introduces a claim the site doesn't already stand behind.
 * Only covers the 3 practice areas currently live (see category-slugs.ts's
 * CURRENT_CATEGORY_SLUGS); add an entry here when a new category launches.
 */
export const CATEGORY_KEY_TERMS: Record<string, LegalKeyTerm[]> = {
  'maritime-offshore-injury-law': [
    {
      term: 'Jones Act',
      definition:
        "A federal statute (46 U.S.C. § 30104) giving an injured \"seaman\" the right to sue their employer for negligence, and giving certain survivors a wrongful death claim in a death case.",
      href: '/jones-act-seamans-injury-rights',
    },
    {
      term: 'Seaman',
      definition:
        "A legal status, not a job title — someone with an employment-based connection to a vessel in navigation that's substantial in both nature and duration. Whether a worker qualifies determines which framework, the Jones Act or the LHWCA, governs their injury.",
      href: '/jones-act-seamans-injury-rights',
    },
    {
      term: 'Maintenance and Cure',
      definition:
        'A no-fault maritime doctrine requiring an employer to pay a qualifying seaman a daily living allowance ("maintenance") and cover medical expenses ("cure") until they reach maximum medical improvement, regardless of who was at fault.',
      href: '/maintenance-and-cure-explained',
    },
    {
      term: 'Unseaworthiness',
      definition:
        'A general maritime law doctrine holding that a vessel owner must provide a vessel, equipment, and crew reasonably fit for their intended purpose — a claim distinct from an ordinary negligence claim.',
      href: '/jones-act-vs-general-maritime-law',
    },
    {
      term: 'General Maritime Law',
      definition:
        'Federal common law — judge-made rather than a single comprehensive statute — governing maritime torts such as negligence and unseaworthiness, built up through admiralty court decisions over time.',
      href: '/jones-act-vs-general-maritime-law',
    },
    {
      term: "Longshore and Harbor Workers' Compensation Act (LHWCA)",
      definition:
        "A federal workers'-compensation statute (33 U.S.C. § 901 et seq.) covering maritime workers injured on navigable waters, or adjoining loading, unloading, or repair areas, who don't qualify as \"seamen\" under the Jones Act.",
      href: '/oil-rig-injury-lawyer',
    },
    {
      term: 'Offshore Accident',
      definition:
        'A general term for an accident occurring in connection with offshore work, such as on a drilling platform, production facility, or offshore support vessel.',
      href: '/offshore-accident-lawyer',
    },
    {
      term: 'Navigable Waters',
      definition:
        'Waters used, or capable of being used, for interstate or foreign commerce — the legal concept that helps determine whether federal maritime law applies to a given body of water and the activity on it.',
      href: '/maritime-offshore-injury-law/overview',
    },
    {
      term: 'Death on the High Seas Act (DOHSA)',
      definition:
        'A federal statute (46 U.S.C. § 30302 et seq.) providing a wrongful death remedy for deaths occurring more than three nautical miles from U.S. shores, with its own rules on who can bring a claim and what damages are recoverable.',
      href: '/offshore-accident-statute-of-limitations',
    },
    {
      term: 'Statute of Limitations (Maritime Claims)',
      definition:
        "The deadline by which an offshore or maritime injury claim must be filed — often governed by different rules, and sometimes a shorter window, than an ordinary state-law personal injury deadline.",
      href: '/offshore-accident-statute-of-limitations',
    },
  ],

  'cruise-ship-passenger-vessel-accidents': [
    {
      term: 'Cruise Ship Accident',
      definition:
        "An incident resulting in injury aboard a cruise ship or during a cruise-related activity like a shore excursion, typically governed by a mix of maritime law and the specific terms of the passenger's ticket contract.",
      href: '/cruise-ship-accident-lawyer',
    },
    {
      term: 'Passenger Vessel',
      definition:
        'A vessel, such as a cruise ship or ferry, whose primary purpose is transporting paying passengers, as distinguished from a commercial cargo vessel or a private recreational boat.',
      href: '/cruise-ship-accident-lawyer',
    },
    {
      term: 'Tender Boat',
      definition:
        "A smaller vessel used to move passengers between a larger ship anchored offshore and the shore, when the larger vessel can't dock directly at a port.",
      href: '/tender-boat-excursion-dinner-cruise-accidents',
    },
    {
      term: 'Forum Selection Clause',
      definition:
        "Most major cruise lines' ticket contracts require any lawsuit to be filed in one specific court — commonly the U.S. District Court for the Southern District of Florida in Miami — regardless of where the passenger lives or boarded.",
      href: '/cruise-ship-accident-lawyer-miami',
    },
    {
      term: 'Contractual Limitations Period',
      definition:
        'Cruise ticket contracts frequently shorten the deadline to sue — and require written notice of a claim even sooner — to a period well under the general state-law statute of limitations, often one year or less.',
      href: '/cruise-line-accident-claims-by-brand',
    },
    {
      term: 'Maritime Law (Cruise Ships)',
      definition:
        "The body of federal law governing vessel operations and injuries occurring on navigable waters, which applies to cruise ship incidents alongside — and sometimes in place of — the passenger's ticket contract terms.",
      href: '/cruise-ship-accident-lawyer',
    },
    {
      term: 'Comparative Negligence',
      definition:
        "A rule, used in some form by most U.S. states, under which an injured passenger's compensation is reduced by their own percentage of fault for the accident rather than barring recovery outright.",
      href: '/cruise-ship-accident-lawyer-los-angeles',
    },
    {
      term: 'Shore Excursion Liability',
      definition:
        "Whether a cruise line can be held responsible for an injury during a shore excursion generally depends on whether the excursion operator was the cruise line's own employee or an independent contractor the line merely booked.",
      href: '/tender-boat-excursion-dinner-cruise-accidents',
    },
    {
      term: 'Notice of Claim',
      definition:
        'A formal written notice, often required within a short window under a cruise ticket contract, informing the cruise line of an injury before a lawsuit can be filed — a separate and earlier deadline than the statute of limitations itself.',
      href: '/cruise-ship-accident-lawyer-miami',
    },
    {
      term: 'Venue',
      definition:
        "The specific geographic court location where a case is properly filed — for most major cruise lines, fixed by contract rather than left to the passenger's choice.",
      href: '/cruise-ship-accident-lawyer-miami',
    },
  ],

  'personal-injury-lawyer': [
    {
      term: 'Personal Injury',
      definition:
        "Harm to a person's body, mind, or emotional well-being caused by another party's negligence or wrongful conduct, and the broader legal category of claims seeking compensation for that harm.",
      href: '/what-is-a-personal-injury-lawyer',
    },
    {
      term: 'Negligence',
      definition:
        'The legal theory underlying most personal injury claims: a failure to exercise the level of care a reasonably prudent person would have exercised under similar circumstances, resulting in harm to someone else.',
      href: '/what-is-a-personal-injury-lawyer',
    },
    {
      term: 'Comparative Negligence',
      definition:
        "A rule, used in some form by most U.S. states, under which an injured person's compensation is reduced by their own percentage of fault rather than barring recovery outright.",
      href: '/statute-of-limitations-in-the-us',
    },
    {
      term: 'Statute of Limitations',
      definition:
        'A law setting the deadline by which a lawsuit must be filed, after which the claim can generally be barred permanently — and one that varies significantly from state to state.',
      href: '/statute-of-limitations-in-the-us',
    },
    {
      term: 'Contingency Fee',
      definition:
        "A fee arrangement in which an attorney's payment is a percentage of any settlement or verdict recovered rather than an hourly rate, with no fee generally owed if there's no recovery.",
      href: '/contingency-fee-agreements-explained',
    },
    {
      term: 'Damages',
      definition:
        'The monetary compensation sought or awarded in a civil claim, which can include economic damages (medical bills, lost wages), non-economic damages (pain and suffering), and, in narrower cases, punitive damages.',
      href: '/what-is-a-personal-injury-lawyer',
    },
    {
      term: 'Demand Letter',
      definition:
        "A written communication, typically sent by an injured person's attorney to an insurer, formally describing the claim and requesting a specific settlement amount as an opening move in negotiation.",
      href: '/how-to-choose-a-personal-injury-lawyer',
    },
    {
      term: 'Settlement',
      definition:
        'An agreement resolving a legal claim without a trial, typically a negotiated payment in exchange for the injured person releasing further claims related to the incident.',
      href: '/contingency-fee-agreements-explained',
    },
    {
      term: 'Retainer',
      definition:
        "Depending on context, either an upfront payment held toward future hourly billing, or a fee paid to secure a lawyer's general availability — a different structure from the contingency fees most personal injury lawyers use.",
      href: '/how-much-does-a-lawyer-cost',
    },
    {
      term: 'Medical Lien',
      definition:
        'A legal claim, often held by a health insurer or medical provider, against the proceeds of a settlement or verdict, entitling the lienholder to be reimbursed for treatment before the injured person receives their net recovery.',
      href: '/maritime-offshore-accident-law-glossary',
    },
  ],
};

export function getKeyLegalTermsForCategory(slug: string): LegalKeyTerm[] {
  return CATEGORY_KEY_TERMS[slug] || [];
}
