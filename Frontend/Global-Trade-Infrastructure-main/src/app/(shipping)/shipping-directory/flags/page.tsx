/**
 * @file flags/page.tsx
 * @description Index of every flag state on record, ranked by hulls.
 */
import type { Metadata } from 'next';
import { listCohorts, num } from '@/lib/shipping-directory/api';
import { href, canonical } from '@/lib/shipping-directory/site';
import { breadcrumbJsonLd, itemListJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { CohortIndexPage } from '../_components/cohort-hub';
import { EmptyState } from '../_components/ui';

/** Revalidation policy: see the detail pages — the underlying set changes on an ingest
 *  run, so a day is generous rather than stale. */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Flag states',
  description: 'Every flag state on record, ranked by the number of vessels registered under it — with median tonnage, build-year span and the most common vessel class.',
  alternates: { canonical: canonical('flags') },
};

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const offset = Number(first(sp.offset) ?? 0) || 0;
  const rows = await listCohorts('flag');
  if (!rows || rows.length === 0) {
    return (
      <div className="mx-auto max-w-[1340px] px-6 py-20">
        <EmptyState title="Nothing on record" detail="The registry could not be reached, or holds no vessel attributed to a flag state." />
      </div>
    );
  }
  void num;
  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Flag states', path: 'flags' },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        rows.slice(0, 100).map((r) => ({ name: r.cohort_key, path: `flags/${r.slug}` })),
        { name: 'Flag states by vessels on record' },
      ))} />
      <CohortIndexPage
        rows={rows}
        dimension="flag"
        offset={offset}
        pageHref={(o) => `${href('flags')}${o ? `?offset=${o}` : ''}`}
      />
    </>
  );
}
