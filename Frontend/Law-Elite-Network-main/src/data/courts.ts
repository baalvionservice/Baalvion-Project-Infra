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
];

export function getAllCourts(): Court[] {
  return COURTS;
}

export function getCourtBySlug(slug: string): Court | null {
  const target = slug.toLowerCase();
  return COURTS.find((c) => c.slug === target) ?? null;
}
