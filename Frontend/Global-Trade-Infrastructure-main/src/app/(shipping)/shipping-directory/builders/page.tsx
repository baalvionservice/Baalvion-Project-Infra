/**
 * @file builders/page.tsx
 * @description Index of every shipbuilder on record, ranked by hulls.
 */
import type { Metadata } from 'next';
import { listCohorts, num } from '@/lib/shipping-directory/api';
import { canonical } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { CohortIndexPage } from '../_components/cohort-hub';
import { EmptyState } from '../_components/ui';

/** Revalidation policy: see the detail pages — the underlying set changes on an ingest
 *  run, so a day is generous rather than stale. */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Shipbuilders',
  description: 'Every shipbuilder on record, ranked by the number of vessels attributed to it — with median tonnage, delivery span and the classes each yard builds.',
  alternates: { canonical: canonical('builders') },
};

export default async function Page() {
  const rows = await listCohorts('builder');
  if (!rows || rows.length === 0) {
    return (
      <div className="mx-auto max-w-[1340px] px-6 py-20">
        <EmptyState title="Nothing on record" detail="The registry could not be reached, or holds no vessel attributed to a shipbuilder." />
      </div>
    );
  }
  void num;
  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Shipbuilders', path: 'builders' },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        rows.slice(0, 100).map((r) => ({ name: r.cohort_key, path: `builders/${r.slug}` })),
        { name: 'Shipbuilders by vessels on record' },
      ))} />
      <CohortIndexPage rows={rows} dimension="builder" />
    </>
  );
}
