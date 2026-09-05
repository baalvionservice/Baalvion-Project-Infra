/**
 * @file (shipping)/shipping-directory/page.tsx
 * @description Directory front page — what the registry holds, and the way in.
 *
 * The coverage panel is not decoration and is not buried. This registry knows about far
 * more ships than it can attribute to an operator, and a reader who compares a company
 * page here against an industry figure has to see that stated up front rather than
 * discover it as an apparent contradiction three pages in.
 */
import Link from 'next/link';
import { getStats, getRankings, num, pct, typeLabel } from '@/lib/shipping-directory/api';
import { href, canonical } from '@/lib/shipping-directory/site';
import { datasetJsonLd, webSiteJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import { BarRow, EmptyState, SectionHead, Eyebrow, TableShell, Th, FleetNumbersNote } from './_components/ui';
import { Logo } from './_components/media';

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

// Absolute, because title.template applies to CHILD segments only — a plain 'Overview'
// here would fall through to the root app's "%s | Baalvion OS" template and title the
// directory's front door as if it were a page of the trade app.
export const metadata = {
  title: { absolute: 'World Shipping Directory — every shipping company and its ships' },
  description:
    'A reference registry of merchant and state-operated vessels keyed on IMO number, and of the companies that own and operate them. Founders, leadership, fleets, tonnage, flag states and published capacity rankings — every figure with its source.',
  alternates: { canonical: canonical() },
};

export default async function DirectoryHome() {
  const [stats, rankings] = await Promise.all([getStats(), getRankings()]);

  if (!stats) {
    return (
      <div className="mx-auto max-w-[1340px] px-6 py-20">
        <EmptyState
          title="The registry is unavailable"
          detail="The directory service could not be reached, so there is nothing verified to show. No placeholder figures are rendered in its place."
        />
      </div>
    );
  }

  const t = stats.totals;
  const linkedPct = t.vessels > 0 ? Math.round((t.vessels_with_operator / t.vessels) * 100) : 0;
  const maxType = Math.max(...stats.byType.map((r) => r.n), 0);
  const maxFlag = Math.max(...stats.byFlag.map((r) => r.n), 0);
  const maxCountry = Math.max(...stats.topCountries.map((r) => r.n), 0);
  const builders = stats.topBuilders ?? [];
  const maxBuilder = Math.max(...builders.map((r) => r.n), 0);

  const headline = [
    { label: 'Vessels on record', value: num(t.vessels), note: `${num(t.vessels_with_operator)} attributed to an operator` },
    { label: 'Companies', value: num(t.companies), note: `${num(t.commercial_companies)} commercial operators` },
    { label: 'Flag states', value: num(t.flag_states), note: 'Distinct countries of registry' },
    { label: 'Combined gross tonnage', value: num(t.total_gross_tonnage), note: 'Summed where tonnage is recorded' },
  ];

  return (
    <>
      <script {...jsonLdProps(datasetJsonLd({ vessels: t.vessels, companies: t.companies }))} />
      <script {...jsonLdProps(webSiteJsonLd())} />

      {/* ── Hero. Colour comes from the surface, not from stock photography. ──── */}
      <section className="wsd-violet-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:items-end">
            <div>
              <Eyebrow className="!text-white/65">Open reference registry</Eyebrow>
              <h1 className="mt-4 max-w-3xl text-[42px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[64px]">
                Every shipping company, and the ships it sails.
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/85">
                {num(t.vessels)} merchant and state-operated vessels keyed on their IMO number, and the{' '}
                {num(t.companies)} companies that own and operate them — with founders, leadership,
                ownership, fleet composition and published capacity rankings. Every figure below is a
                count over records actually held. Nothing is estimated to fill a gap.
              </p>

              <form action={href('ships')} className="mt-9 flex max-w-xl flex-wrap gap-2">
                <input
                  name="q"
                  placeholder="Ship name, IMO number or call sign…"
                  aria-label="Search the vessel registry"
                  className="min-w-[240px] flex-1 border-2 border-white bg-white px-4 py-3 text-[15px] text-wsd-ink outline-none placeholder:text-wsd-muted"
                />
                <button type="submit" className="bg-wsd-ink px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-black">
                  Search
                </button>
              </form>
              <p className="mt-3 text-[13px] text-white/60">
                Or <Link href={href('companies')} className="underline underline-offset-4 hover:text-white">browse companies</Link>{' '}
                · <Link href={href('rankings')} className="underline underline-offset-4 hover:text-white">the capacity ranking</Link>{' '}
                · <Link href={href('countries')} className="underline underline-offset-4 hover:text-white">by country</Link>
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-px bg-white/25 min-[420px]:grid-cols-2">
              {headline.map((h) => (
                <div key={h.label} className="wsd-violet-field p-5">
                  <dt className="wsd-eyebrow !text-white/60">{h.label}</dt>
                  <dd>
                    <span data-figure className="mt-2 block text-[26px] font-extrabold leading-none tracking-[-0.03em] sm:text-[30px]">
                      {h.value ?? '—'}
                    </span>
                    <span className="mt-2 block text-[12px] leading-snug text-white/65">{h.note}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Coverage, stated plainly ─────────────────────────────────────────── */}
      <section className="border-b-4 border-wsd-yellow bg-wsd-ground-alt">
        <div className="mx-auto grid max-w-[1340px] gap-8 px-6 py-10 lg:grid-cols-[auto_1fr] lg:items-start">
          <p className="wsd-eyebrow lg:w-48">Coverage, stated plainly</p>
          <div className="max-w-4xl space-y-3 text-[15.5px] leading-relaxed text-wsd-body">
            <p>
              Of the {num(t.vessels)} vessels held, <strong className="font-bold text-wsd-ink">{num(t.vessels_with_operator)} ({linkedPct}%)</strong>{' '}
              are linked to an identified operator. Fleet counts on company pages therefore reflect
              what can be attributed, not the company&rsquo;s full fleet. Where an operator also
              publishes a fleet size — {num(t.companies_with_reported_fleet)} companies do — that
              published figure is shown alongside, labelled and dated.
            </p>
            <p>
              {num(t.companies_with_summary)} companies carry a written summary quoted from Wikipedia,
              {' '}{num(t.companies_with_founder)} name at least one founder, and {num(t.vessels_with_photo)}{' '}
              vessels have a photograph we can attribute to its photographer. Where any of those is
              missing, the page simply does without it.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1340px] px-6">
        {/* ── The ranking, as the front page's lead table ──────────────────────── */}
        {rankings && rankings.data.length > 0 ? (
          <section className="mt-20">
            <SectionHead
              eyebrow="Published ranking"
              title="The largest container lines by capacity"
              aside={rankings.provenance ? (
                <>
                  {rankings.provenance.sourceUrl ? (
                    <a href={rankings.provenance.sourceUrl} target="_blank" rel="noreferrer" className="wsd-link">
                      {rankings.provenance.source}
                    </a>
                  ) : rankings.provenance.source}
                  {rankings.provenance.asOf ? ` · as of ${String(rankings.provenance.asOf).slice(0, 10)}` : null}
                </>
              ) : null}
              note="Reproduced from a dated industry source. These are the industry's numbers, not this directory's — the last column is ours, and it counts something different."
            />
            <TableShell minWidth={860}>
              <thead>
                <tr className="border-b border-wsd-ink">
                  <Th>#</Th>
                  <Th>Company</Th>
                  <Th>Headquarters</Th>
                  <Th align="right">TEU capacity</Th>
                  <Th align="right">Reported ships</Th>
                  <Th align="right">Market share</Th>
                  <Th align="right">In registry</Th>
                </tr>
              </thead>
              <tbody>
                {rankings.data.slice(0, 12).map((c) => (
                  <tr key={c.slug} className="border-b border-wsd-line-soft last:border-0 hover:bg-wsd-ground-alt">
                    <td className="px-4 py-3 font-bold text-wsd-violet">{c.capacity_rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Logo src={c.logo_url} name={c.name} size="sm" />
                        <div>
                          <Link href={href(`companies/${c.slug}`)} className="font-bold text-wsd-ink hover:text-wsd-violet">
                            {c.name}
                          </Link>
                          {c.alliance ? <p className="text-[12px] text-wsd-muted">{c.alliance}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-wsd-body">{c.headquarters ?? c.country ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-bold">{num(c.reported_teu) ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{num(c.reported_fleet_size) ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-wsd-body">{pct(c.market_share_pct) ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-wsd-muted">{num(c.registry_vessel_count)}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <FleetNumbersNote className="max-w-2xl" />
              <Link href={href('rankings')} className="shrink-0 border border-wsd-ink px-5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-wsd-ink hover:text-white">
                Full ranking →
              </Link>
            </div>
          </section>
        ) : null}

        {/* ── Dimensions ───────────────────────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead
            eyebrow="Browse the registry"
            title="By type, flag, country and builder"
            note="Every bar below is a link into the filtered list. Widths are true proportions of the registry, not of the world fleet."
          />
          <div className="grid gap-10 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <Eyebrow className="mb-3">Vessels by type</Eyebrow>
              {stats.byType.slice(0, 12).map((r) => (
                <BarRow
                  key={r.vessel_type}
                  label={typeLabel(r.vessel_type)}
                  value={r.n}
                  max={maxType}
                  accent
                  href={href(`ships/type/${r.vessel_type}`)}
                />
              ))}
            </div>
            <div>
              <Eyebrow className="mb-3">Top flag states</Eyebrow>
              {stats.byFlag.slice(0, 12).map((r) => (
                <BarRow
                  key={r.flag_country}
                  label={r.flag_country}
                  value={r.n}
                  max={maxFlag}
                  href={`${href('ships')}?flag=${encodeURIComponent(r.flag_country)}`}
                />
              ))}
            </div>
            <div>
              <Eyebrow className="mb-3">Companies by country</Eyebrow>
              {stats.topCountries.slice(0, 12).map((r) => (
                <BarRow
                  key={r.country}
                  label={r.country}
                  value={r.n}
                  max={maxCountry}
                  href={r.country_code ? href(`countries/${r.country_code.toLowerCase()}`) : href('countries')}
                />
              ))}
            </div>
            <div>
              <Eyebrow className="mb-3">Shipbuilders by hulls on record</Eyebrow>
              {builders.slice(0, 12).map((r) => (
                <BarRow
                  key={r.builder_name}
                  label={r.builder_name}
                  value={r.n}
                  max={maxBuilder}
                  href={`${href('ships')}?q=${encodeURIComponent(r.builder_name)}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Entry points ─────────────────────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead eyebrow="Start here" title="Three ways in" />
          <div className="grid gap-px bg-wsd-line-soft lg:grid-cols-3">
            {[
              {
                to: href('companies'),
                title: 'Browse companies',
                body: `${num(t.companies)} operators across ${num(t.company_countries)} countries — founders, leadership, ownership, fleet composition and a ten-year delivery record for each.`,
              },
              {
                to: href('ships'),
                title: 'Search ships',
                body: `${num(t.vessels)} vessels searchable by name, IMO number, call sign, type, flag and build year, with full particulars and rank by tonnage.`,
              },
              {
                to: href('countries'),
                title: 'By country',
                body: `Shipping sectors compared across ${num(t.company_countries)} countries of registration, with the fleet each one holds between its operators.`,
              },
            ].map((card) => (
              <Link key={card.to} href={card.to} className="group bg-white p-8 transition-colors hover:bg-wsd-ground-alt">
                <p className="text-[21px] font-extrabold tracking-[-0.02em] text-wsd-ink group-hover:text-wsd-violet">
                  {card.title} <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-wsd-body">{card.body}</p>
              </Link>
            ))}
          </div>
        </section>

        {t.last_ingested_at ? (
          <p className="mt-16 text-[13px] text-wsd-muted">
            Registry last refreshed {String(t.last_ingested_at).slice(0, 10)}.
          </p>
        ) : null}
      </div>
    </>
  );
}
