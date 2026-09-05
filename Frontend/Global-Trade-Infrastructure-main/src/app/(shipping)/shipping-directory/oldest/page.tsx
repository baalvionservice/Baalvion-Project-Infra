/**
 * @file oldest/page.tsx
 * @description The oldest vessels still on record, by build year.
 *
 * A head query for the niche this directory can win. The free competition for "largest
 * ships in the world" is prose with a handful of examples; this is a sourced table over
 * 95,871 hulls. See _components/superlative.tsx for how the "in this registry, not in the
 * world" boundary is stated rather than blurred.
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { listVessels, getStats } from '@/lib/shipping-directory/api';
import { canonical } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { SuperlativeList } from '../_components/superlative';

/**
 * NOT PRERENDERED AT BUILD TIME.
 *
 * This page reads the registry and has no searchParams, so Next would prerender it during
 * `next build` — where, inside Docker, there is no network route to the API. The fetch
 * fails, the page renders its "registry unavailable" empty state, and THAT gets baked into
 * the image. With revalidate at a day, the empty state then served for a day.
 *
 * The sibling list pages escaped this only by accident: they await searchParams, which
 * already makes them dynamic. Made explicit here rather than left to that coincidence.
 * Caching is not lost — middleware.ts sets Cache-Control with s-maxage for this host, so a
 * CDN holds the result.
 */
export const dynamic = 'force-dynamic';
/** Revalidation policy: see the detail pages — the underlying set changes on an ingest
 *  run, so a day is generous rather than stale. */
export const revalidate = 86400;

const TOP = 100;

export const metadata: Metadata = {
  title: 'The oldest ships on record',
  description: 'The oldest merchant and state-operated vessels still on record, ranked by build year, with IMO number, flag, operator and tonnage for each.',
  alternates: { canonical: canonical('oldest') },
};

export default async function Page() {
  const type: string | null = null;
  const [result, stats] = await Promise.all([
    listVessels({ sort: 'oldest', limit: TOP }),
    getStats(),
  ]);
  if (!result || result.data.length === 0) notFound();

  const byType = (stats?.byType ?? []).filter((t) => t.vessel_type !== 'other');

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Oldest ships', path: 'oldest' },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        result.data.map((v) => ({ name: v.name, path: `ships/${v.slug}` })),
        { name: 'The oldest ships on record' },
      ))} />
      <SuperlativeList
        vessels={result.data}
        stats={{
          total: result.total,
          withMeasure: result.total,
          biggest: result.data[0]?.gross_tonnage ?? null,
          median: null,
        }}
        type={type}
        siblings={byType}
        measure="age"
      />
    </>
  );
}
