/**
 * @fileOverview LEN Legal — bundled Court entities. Institutions only
 * (name, level, jurisdiction, official site) — no case outcomes or opinions
 * stored here, that's @/data/legal-cases.ts referencing back by `courtSlug`.
 */

import type { Court } from '@/types/legal';

export const COURTS: Court[] = [
  {
    slug: 'supreme-court-of-the-united-states',
    name: 'Supreme Court of the United States',
    level: 'supreme',
    countryCode: 'US',
    description: 'The highest court in the U.S. federal judiciary, with final appellate jurisdiction over all federal court cases and state court cases involving federal law.',
    url: 'https://www.supremecourt.gov/',
  },
  {
    slug: 'us-district-court-northern-district-of-texas',
    name: 'U.S. District Court for the Northern District of Texas',
    level: 'trial',
    countryCode: 'US',
    description: 'A federal trial court with jurisdiction over the northern district of Texas, including the Amarillo division.',
    url: 'https://www.txnd.uscourts.gov/',
  },
  {
    slug: 'us-court-of-appeals-fifth-circuit',
    name: 'United States Court of Appeals for the Fifth Circuit',
    level: 'appellate',
    countryCode: 'US',
    description: 'A federal appellate court with jurisdiction over appeals from federal district courts in Texas, Louisiana, and Mississippi.',
    url: 'https://www.ca5.uscourts.gov/',
  },
  {
    slug: 'cairo-criminal-court',
    name: 'Cairo Criminal Court',
    level: 'trial',
    countryCode: 'EG',
    description: 'A criminal trial court in Cairo, Egypt.',
  },
  {
    slug: 'delaware-court-of-chancery',
    name: 'Delaware Court of Chancery',
    level: 'other',
    countryCode: 'US',
    description: 'The nation’s premier business equity court, establishing foundational corporate governance precedents for Fortune 500 corporations.',
    url: 'https://courts.delaware.gov/chancery/',
  },
  {
    slug: 'us-district-court-southern-district-of-new-york',
    name: 'U.S. District Court for the Southern District of New York (SDNY)',
    level: 'trial',
    countryCode: 'US',
    description: 'The historic federal trial court in Manhattan, handling major Wall Street financial litigation, copyright disputes, and high-profile criminal cases.',
    url: 'https://www.nysd.uscourts.gov/',
  },
  {
    slug: 'court-of-arbitration-for-sport',
    name: 'Court of Arbitration for Sport (CAS / TAS)',
    level: 'international',
    countryCode: 'CH',
    description: 'The supreme international tribunal headquartered in Lausanne, Switzerland, rendering binding arbitration decisions on global sports disputes.',
    url: 'https://www.tas-cas.org/',
  },
  {
    slug: 'turin-labour-court',
    name: 'Turin Labour Court',
    level: 'trial',
    countryCode: 'IT',
    description: 'The Italian court in Turin that hears employment and labour disputes, including the appeal in Ronaldo v. Juventus.',
  },
];

export function getAllCourts(): Court[] {
  return COURTS;
}

export function getCourtBySlug(slug: string): Court | null {
  const target = slug.toLowerCase();
  return COURTS.find((c) => c.slug === target) ?? null;
}
