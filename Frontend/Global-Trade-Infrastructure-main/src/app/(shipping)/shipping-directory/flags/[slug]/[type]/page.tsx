/**
 * @file flags/[slug]/[type]/page.tsx
 * @description One flag state crossed with one vessel type — "Panama-flagged bulk carriers".
 *
 * WHY THIS EXISTS. "Panama-flagged ships" (9,598 hulls) and "bulk carriers" (6,890) are
 * each true of thousands of pages and read as generic. Crossing them narrows to something
 * specific a reader actually searches for, and 272 combinations hold 25 or more vessels,
 * covering 26,143 hulls between them. Until now that cut existed only as a two-parameter
 * search view carrying noindex.
 *
 * The 25-vessel floor lives in build-context.js, not here: 212 flags x 26 types is 5,512
 * possible pairs, and a page for every one would be thousands of near-empty tables — the
 * scaled-content shape this whole layer exists to avoid. A pair below the floor has no
 * cohort row, so this route 404s for it rather than rendering a stub.
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCohort, num, typeLabel } from '@/lib/shipping-directory/api';
import { href, canonical } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { CohortHubPage } from '../../../_components/cohort-hub';

/**
 * Revalidation policy: this record changes only when the ingest re-runs, which is monthly
 * at most — NOT every five minutes. The original 300 here was multiplied across ~99,700
 * ISR-backed URLs, and on a metered host every regeneration is a billable ISR write. Seven
 * days, refreshed on demand after an ingest, is what the data actually warrants.
 */
export const revalidate = 604800;

const PAGE_SIZE = 60;
type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; type: string }> },
): Promise<Metadata> {
  const { slug, type } = await params;
  const hub = await getCohort('flag_type', `${slug}/${type}`);
  if (!hub) return { title: 'Not found', robots: { index: false, follow: true } };

  const c = hub.cohort;
  const flag = (c as { flag?: string }).flag ?? '';
  const label = typeLabel(type).toLowerCase();
  const span = c.oldest_year && c.newest_year ? `${c.oldest_year}–${c.newest_year}` : null;

  return {
    title: `${flag}-flagged ${label}s`,
    description: `${num(c.n)} ${label}s registered under the flag of ${flag}`
      + `${span ? `, built ${span}` : ''}`
      + `${c.median_gt ? `, median ${num(c.median_gt)} GT` : ''}`
      + `${c.top_builder ? `, most from ${c.top_builder}` : ''}`
      + '. Full list with IMO number, tonnage, operator and builder.',
    alternates: { canonical: canonical(`flags/${slug}/${type}`) },
  };
}

export default async function Page({
  params, searchParams,
}: {
  params: Promise<{ slug: string; type: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug, type } = await params;
  const sp = await searchParams;
  const offset = Number(first(sp.offset) ?? 0) || 0;

  const hub = await getCohort('flag_type', `${slug}/${type}`, { limit: PAGE_SIZE, offset });
  if (!hub) notFound();

  const flag = (hub.cohort as { flag?: string }).flag ?? '';
  const path = `flags/${slug}/${type}`;
  const pageHref = (o: number) => `${href(path)}${o ? `?offset=${o}` : ''}`;

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Flag states', path: 'flags' },
        { label: flag, path: `flags/${slug}` },
        { label: typeLabel(type), path },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        hub.vessels.data.map((v) => ({ name: v.name, path: `ships/${v.slug}` })),
        { name: `${flag}-flagged ${typeLabel(type).toLowerCase()}s`, offset },
      ))} />
      <CohortHubPage hub={hub} dimension="flag_type" pageHref={pageHref} />
    </>
  );
}
