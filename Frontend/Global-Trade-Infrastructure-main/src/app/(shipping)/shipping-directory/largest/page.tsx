/**
 * @file largest/page.tsx
 * @description The largest vessels on record, by gross tonnage.
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

/** Revalidation policy: see the detail pages — the underlying set changes on an ingest
 *  run, so a day is generous rather than stale. */
export const revalidate = 86400;

const TOP = 100;

export const metadata: Metadata = {
  title: 'The largest ships on record',
  description: 'The largest merchant and state-operated vessels on record, ranked by gross tonnage, with IMO number, flag, operator, builder and dimensions for each.',
  alternates: { canonical: canonical('largest') },
};

export default async function Page() {
  const type: string | null = null;
  const [result, stats] = await Promise.all([
    listVessels({ sort: 'tonnage', limit: TOP }),
    getStats(),
  ]);
  if (!result || result.data.length === 0) notFound();

  const byType = (stats?.byType ?? []).filter((t) => t.vessel_type !== 'other');

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Largest ships', path: 'largest' },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        result.data.map((v) => ({ name: v.name, path: `ships/${v.slug}` })),
        { name: 'The largest ships on record' },
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
        measure="tonnage"
      />
    </>
  );
}
