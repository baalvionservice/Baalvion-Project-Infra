/**
 * @file builders/[slug]/page.tsx
 * @description One shipbuilder — every hull on record against it.
 *
 * Thin route around CohortHubPage: the builder and flag hubs are structurally the same
 * page over the same precomputed cohort statistics, and keeping two copies would let them
 * drift. See _components/cohort-hub.tsx for why these pages exist at all.
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCohort, num, typeLabel } from '@/lib/shipping-directory/api';
import { href, canonical } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { CohortHubPage } from '../../_components/cohort-hub';

export const revalidate = 300;

const PAGE_SIZE = 60;
type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const hub = await getCohort('builder', slug);
  if (!hub) return { title: 'Shipbuilder not found', robots: { index: false, follow: true } };

  const c = hub.cohort;
  const span = c.oldest_year && c.newest_year ? `${c.oldest_year}–${c.newest_year}` : null;
  return {
    title: `Ships built by ${c.cohort_key}`,
    description: `${num(c.n)} vessels built by ${c.cohort_key} on record${span ? `, delivered ${span}` : ''}`
      + `${c.top_type ? `, mostly ${typeLabel(c.top_type).toLowerCase()}s` : ''}`
      + `${c.median_gt ? `, median ${num(c.median_gt)} GT` : ''}. Full list with IMO number, tonnage, operator and dimensions.`,
    alternates: { canonical: canonical(`builders/${slug}`) },
  };
}

export default async function Page({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const offset = Number(first(sp.offset) ?? 0) || 0;

  const hub = await getCohort('builder', slug, { limit: PAGE_SIZE, offset });
  if (!hub) notFound();

  const path = `builders/${slug}`;
  const pageHref = (o: number) => `${href(path)}${o ? `?offset=${o}` : ''}`;

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Shipbuilders', path: 'builders' },
        { label: hub.cohort.cohort_key, path },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        hub.vessels.data.map((v) => ({ name: v.name, path: `ships/${v.slug}` })),
        { name: `Vessels built by ${hub.cohort.cohort_key}`, offset },
      ))} />
      <CohortHubPage hub={hub} dimension="builder" pageHref={pageHref} />
    </>
  );
}
