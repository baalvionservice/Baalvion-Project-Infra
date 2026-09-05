/**
 * @file oldest/[type]/page.tsx
 * @description The oldest vessels of one type, by build year.
 *
 * A head query for the niche this directory can win. The free competition for "largest
 * ships in the world" is prose with a handful of examples; this is a sourced table over
 * 95,871 hulls. See _components/superlative.tsx for how the "in this registry, not in the
 * world" boundary is stated rather than blurred.
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { listVessels, getStats, num, typeLabel, VESSEL_TYPE_LABELS } from '@/lib/shipping-directory/api';
import { canonical } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { SuperlativeList } from '../../_components/superlative';

export const revalidate = 300;

const TOP = 100;

/** Only types the directory classifies get a page; anything else 404s rather than
 *  rendering an empty ranking a crawler would happily index by the dozen. */
const isKnownType = (t: string) =>
  Object.prototype.hasOwnProperty.call(VESSEL_TYPE_LABELS, t) && t !== 'other';

export async function generateMetadata(
  { params }: { params: Promise<{ type: string }> },
): Promise<Metadata> {
  const { type } = await params;
  if (!isKnownType(type)) return { title: 'Unknown vessel type', robots: { index: false, follow: false } };
  const label = typeLabel(type);
  const stats = await getStats();
  const n = stats?.byType.find((t) => t.vessel_type === type)?.n;
  return {
    title: `The oldest ${label}s`,
    description: `The oldest ${label.toLowerCase()}s still on record${n ? `, from ${num(n)} vessels` : ''}, ranked by build year — with IMO number, flag, operator and tonnage.`,
    alternates: { canonical: canonical(`oldest/${type}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isKnownType(type)) notFound();

  const [result, stats] = await Promise.all([
    listVessels({ type, sort: 'oldest', limit: TOP }),
    getStats(),
  ]);
  if (!result || result.data.length === 0) notFound();

  const byType = (stats?.byType ?? []).filter((t) => t.vessel_type !== 'other');

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Oldest ships', path: 'oldest' },
        { label: typeLabel(type), path: `oldest/${type}` },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        result.data.map((v) => ({ name: v.name, path: `ships/${v.slug}` })),
        { name: `The oldest ${typeLabel(type)}s on record` },
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
