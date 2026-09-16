/**
 * The desks News Intelligence is organised around.
 *
 * A "niche" is one editorial beat: the wire categories it consumes, and the one
 * site that publishes from them. Only sites with an editorial charter appear
 * here — the charter (cms_editorial_charters.wire_categories) is the source of
 * truth, and `wireCategories` below mirrors it. Adding a desk means writing a
 * charter for that site first; without one the pipeline refuses to run and the
 * desk would show numbers nothing can act on.
 *
 * Deliberately NOT every website. Of the estate's sites, exactly two publish
 * news, and the ingestion feeds carry far more than those two beats — the
 * unclaimed categories are surfaced on the picker rather than silently folded
 * into a desk that does not cover them.
 */

export interface NicheDef {
  id: string;
  label: string;
  /** The publication that turns this beat into articles. */
  site: string;
  /** Slug for /newsroom/<slug> — the pipeline workspace for this desk. */
  siteSlug: string;
  /** news-service categories this desk consumes. Mirrors the site's charter. */
  wireCategories: string[];
  blurb: string;
}

export const NICHES: NicheDef[] = [
  {
    id: 'finance',
    label: 'Finance',
    site: 'Imperialpedia',
    siteSlug: 'imperialpedia',
    wireCategories: ['Finance', 'Business'],
    blurb: 'Markets, the economy, and what a headline means for an ordinary person’s money.',
  },
  {
    id: 'law',
    label: 'Law',
    site: 'Law Elite Network',
    siteSlug: 'law-elite-network',
    wireCategories: ['Legal'],
    blurb: 'Courts, enforcement actions and recalls — read for the people they land on.',
  },
];

export const nicheById = (id: string): NicheDef | undefined =>
  NICHES.find((n) => n.id === id.toLowerCase());

/** Wire categories no desk consumes — ingested, but nothing publishes them. */
export const claimedCategories = new Set(NICHES.flatMap((n) => n.wireCategories));
