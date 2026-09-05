/**
 * @file rankings/page.tsx
 * @description The published container-capacity ranking, in full.
 *
 * This is the one ranking on the site that is not ours: it is reproduced from a dated
 * industry source and shown with that attribution throughout. The registry column sits
 * beside it so a reader can see how much of each fleet this directory documents
 * individually — the two columns answer different questions and are labelled to say so.
 *
 * Laid out as a league table with a capacity bar behind each row, because the shape of
 * this particular dataset is the story: the top three carry roughly as much as the next
 * fifteen, and a column of numbers hides that while a bar shows it immediately.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { getRankings, num, pct } from '@/lib/shipping-directory/api';
import { href, canonical } from '@/lib/shipping-directory/site';
import { itemListJsonLd, breadcrumbJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { EmptyState, SectionHead, Eyebrow, FleetNumbersNote, Breadcrumbs } from '../_components/ui';
import { Logo } from '../_components/media';

/** Revalidation policy: see the detail pages — the underlying set changes on an ingest
 *  run, so a day is generous rather than stale. */
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Largest container shipping companies',
  description:
    'The world’s largest container shipping lines ranked by the TEU capacity of the fleet each one operates, with reported fleet size, market share and alliance membership — reproduced from a dated industry source.',
  alternates: { canonical: canonical('rankings') },
};

export default async function RankingsPage() {
  const rankings = await getRankings();

  if (!rankings || rankings.data.length === 0) {
    return (
      <div className="mx-auto max-w-[1340px] px-6 py-20">
        <EmptyState
          title="No published ranking available"
          detail="No carrier in the registry currently carries a published capacity figure, so there is nothing to rank. A ranking is only shown when it comes from a dated, attributable source."
        />
      </div>
    );
  }

  const { data, provenance } = rankings;
  const totalReported = data.reduce((s, c) => s + (c.reported_fleet_size ?? 0), 0);
  const totalRegistry = data.reduce((s, c) => s + (c.registry_vessel_count ?? 0), 0);
  const totalTeu = data.reduce((s, c) => s + Number(c.reported_teu ?? 0), 0);
  const maxTeu = Math.max(...data.map((c) => Number(c.reported_teu ?? 0)), 0);

  const attribution = provenance ? (
    <>
      {provenance.sourceUrl ? (
        <a href={provenance.sourceUrl} target="_blank" rel="noreferrer" className="wsd-link">{provenance.source}</a>
      ) : provenance.source}
      {provenance.asOf ? `, as of ${String(provenance.asOf).slice(0, 10)}` : ''}
    </>
  ) : null;

  return (
    <>
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Rankings', path: 'rankings' },
      ]))} />
      <script {...jsonLdProps(itemListJsonLd(
        data.map((c) => ({ name: c.name, path: `companies/${c.slug}` })),
        { name: 'Largest container shipping companies by capacity' },
      ))} />

      <header className="wsd-violet-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-14">
          <div className="mb-8 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/85 [&_li]:text-white/40">
            <Breadcrumbs trail={[{ label: 'Directory', href: href() }, { label: 'Rankings' }]} />
          </div>
          <Eyebrow className="!text-white/65">Published ranking</Eyebrow>
          <h1 className="mt-3 max-w-3xl text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[56px]">
            The largest container shipping companies
          </h1>
          <p className="mt-5 max-w-2xl text-[16.5px] leading-relaxed text-white/85">
            Ranked by the TEU capacity of the fleet each company operates.
            {attribution ? <> Figures are reproduced from {attribution}. They are the industry&rsquo;s numbers, not this directory&rsquo;s.</> : null}
          </p>

          <dl className="mt-10 grid gap-px bg-white/25 sm:grid-cols-3">
            {[
              { k: 'Carriers ranked', v: num(data.length) },
              { k: 'Combined capacity', v: totalTeu ? `${num(totalTeu)} TEU` : null },
              { k: 'Ships reported between them', v: num(totalReported) },
            ].map((f) => (
              <div key={f.k} className="wsd-violet-field p-5">
                <dt className="wsd-eyebrow !text-white/60">{f.k}</dt>
                <dd data-figure className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.03em]">
                  {f.v ?? '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6 py-12">
        <SectionHead
          eyebrow="League table"
          title="Ranked by operated TEU capacity"
          aside={attribution}
          note="The bar behind each row is that carrier's capacity as a proportion of the largest. The last column is this directory's own count and measures something different — see the note below the table."
        />

        <ol className="border-t border-wsd-ink">
          {data.map((c) => {
            const teu = Number(c.reported_teu ?? 0);
            const width = maxTeu > 0 ? (teu / maxTeu) * 100 : 0;
            return (
              <li key={c.slug} className="relative border-b border-wsd-line-soft">
                {/* The magnitude bar sits behind the row, not beside it — the row IS the bar. */}
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-wsd-violet-wash"
                  style={{ width: `${width}%` }}
                />
                <Link href={href(`companies/${c.slug}`)} className="relative flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 transition-colors hover:bg-wsd-ground-alt/70">
                  <span data-figure className="w-10 shrink-0 text-[26px] font-extrabold leading-none tracking-[-0.04em] text-wsd-violet">
                    {c.capacity_rank}
                  </span>
                  <Logo src={c.logo_url} name={c.name} credit={c.logo_credit} size="sm" />

                  <div className="min-w-[200px] flex-1">
                    <p className="text-[18px] font-bold tracking-[-0.015em] text-wsd-ink">{c.name}</p>
                    <p className="mt-0.5 text-[13px] text-wsd-muted">
                      {[c.headquarters ?? c.country, c.alliance].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>

                  <dl className="flex flex-wrap gap-x-5 gap-y-2 sm:shrink-0 sm:gap-x-8">
                    {[
                      { k: 'TEU capacity', v: num(c.reported_teu) },
                      { k: 'Reported ships', v: num(c.reported_fleet_size) },
                      { k: 'Market share', v: pct(c.market_share_pct) },
                      { k: 'In registry', v: num(c.registry_vessel_count) ?? '0' },
                    ].map((f) => (
                      <div key={f.k} className="w-20 text-right sm:w-24">
                        <dt className="wsd-eyebrow">{f.k}</dt>
                        <dd data-figure className="mt-1 text-[16px] font-bold text-wsd-ink">
                          {f.v ?? <span className="font-normal text-wsd-line">—</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Link>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-6 border-b-2 border-wsd-ink px-4 py-4">
          <Eyebrow>Totals across the ranking</Eyebrow>
          <dl className="flex flex-wrap gap-x-8">
            <div className="w-20 text-right sm:w-24">
              <dt className="wsd-eyebrow">TEU</dt>
              <dd data-figure className="mt-1 text-[16px] font-extrabold text-wsd-ink">{num(totalTeu)}</dd>
            </div>
            <div className="w-20 text-right sm:w-24">
              <dt className="wsd-eyebrow">Reported ships</dt>
              <dd data-figure className="mt-1 text-[16px] font-extrabold text-wsd-ink">{num(totalReported)}</dd>
            </div>
            <div className="w-20 text-right sm:w-24">
              <dt className="wsd-eyebrow">In registry</dt>
              <dd data-figure className="mt-1 text-[16px] font-extrabold text-wsd-body">{num(totalRegistry)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 max-w-3xl space-y-4">
          <FleetNumbersNote />
          <p className="text-[13px] leading-relaxed text-wsd-muted">
            Open reference data documents only a fraction of the world fleet ship by ship, so
            &ldquo;in registry&rdquo; is always the smaller number. Across this ranking it stands at{' '}
            {num(totalRegistry)} against {num(totalReported)} reported — roughly{' '}
            {totalReported > 0 ? Math.round((totalRegistry / totalReported) * 100) : 0}% coverage. That
            ratio is stated here rather than left for a reader to infer from a discrepancy.
          </p>
        </div>
      </div>
    </>
  );
}
