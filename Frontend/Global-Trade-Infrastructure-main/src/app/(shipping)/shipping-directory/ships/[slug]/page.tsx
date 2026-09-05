/**
 * @file ships/[slug]/page.tsx
 * @description One vessel in full.
 *
 * Photograph-led where a photograph exists under a licence we can honour, and
 * typographic where one does not — there is no stock imagery standing in for a ship we
 * have no picture of.
 *
 * Rank wording is deliberately bounded. The registry does not hold every ship afloat, so
 * a rank here is "Nth largest of the M ships on record that report a tonnage" — never
 * "Nth largest in the world", which the data cannot support.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getVessel, num, dec, typeLabel, type Vessel } from '@/lib/shipping-directory/api';
import { href, canonical, commonsImage } from '@/lib/shipping-directory/site';
import { vesselJsonLd, breadcrumbJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import {
  Field, Chip, SectionHead, Eyebrow, TableShell, Th,
} from '../../_components/ui';
import { CreditLine, QuotedSummary, isPublishable } from '../../_components/media';
import { VesselComparison } from '../../_components/context';

/**
 * Revalidation policy: this record changes only when the ingest re-runs, which is monthly
 * at most — NOT every five minutes. The original 300 here was multiplied across ~99,700
 * ISR-backed URLs, and on a metered host every regeneration is a billable ISR write. Seven
 * days, refreshed on demand after an ingest, is what the data actually warrants.
 */
export const revalidate = 604800;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getVessel(slug);
  if (!result) return { title: 'Ship not found', robots: { index: false, follow: true } };

  const v = result.vessel;
  const path = `ships/${slug}`;
  const facts = [
    typeLabel(v.vessel_type),
    v.imo_number ? `IMO ${v.imo_number}` : null,
    v.flag_country ? `flagged ${v.flag_country}` : null,
    v.year_built ? `built ${v.year_built}` : null,
    v.builder_name ? `by ${v.builder_name}` : null,
    v.gross_tonnage ? `${num(v.gross_tonnage)} GT` : null,
    v.carrier_name ? `operated by ${v.carrier_name}` : null,
  ].filter(Boolean).join(' · ');

  const image = commonsImage(v.image_url, 1200);

  return {
    title: v.name,
    description: `${v.name} — ${facts}. Full particulars, dimensions, capacity, rank by tonnage and sister ships.`,
    alternates: { canonical: canonical(path) },
    // 52,364 hulls have no photograph, no summary, no builder and no operator — the page
    // is a name, an IMO number and a flag on a shared template. Those stay crawlable and
    // linked (follow) but are not submitted for indexing.
    robots: v.is_indexable === false ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: 'article',
      title: `${v.name} · World Shipping Directory`,
      description: facts,
      url: canonical(path),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

function Rank({ label, rank, total, note }: { label: string; rank: number; total: number; note?: string }) {
  return (
    <div className="bg-white p-5">
      <p className="wsd-eyebrow">{label}</p>
      <p data-figure className="mt-2 text-[34px] font-extrabold leading-none tracking-[-0.03em] text-wsd-ink">
        #{num(rank)}
      </p>
      <p className="mt-2 text-[12.5px] leading-snug text-wsd-muted">
        of {num(total)} {note ?? 'with a recorded tonnage'}
      </p>
    </div>
  );
}

/** A compact linked row of related ships. Used for sisters, yard mates and fleet mates. */
function ShipStrip({ ships }: { ships: Vessel[] }) {
  return (
    <div className="grid gap-px bg-wsd-line-soft sm:grid-cols-2 lg:grid-cols-3">
      {ships.map((s) => (
        <Link key={s.slug} href={href(`ships/${s.slug}`)} className="group flex items-center gap-3 bg-white p-4 transition-colors hover:bg-wsd-ground-alt">
          {s.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={commonsImage(s.image_url, 160) ?? ''} alt="" loading="lazy" className="h-12 w-20 shrink-0 border border-wsd-line-soft object-cover" />
          ) : (
            <span aria-hidden className="h-12 w-20 shrink-0 border border-wsd-line-soft bg-wsd-ground-mid" />
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-wsd-ink group-hover:text-wsd-violet">{s.name}</p>
            <p className="mt-0.5 text-[12.5px] text-wsd-muted" data-figure>
              {s.year_built ?? '—'}
              {s.gross_tonnage ? ` · ${num(s.gross_tonnage)} GT` : ''}
              {s.flag_country ? ` · ${s.flag_country}` : ''}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function ShipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getVessel(slug);
  if (!result) notFound();

  const { vessel: v, ranks, sisters, yardMates = [], fleetMates = [], context } = result;
  const meta = (v.metadata ?? {}) as Record<string, unknown>;
  const checkDigitValid = meta.imo_check_digit_valid;
  const nameLanguage = meta.name_language as string | undefined;
  const path = `ships/${slug}`;

  const photo = commonsImage(v.image_url, 1600);
  const showPhoto = Boolean(photo && isPublishable(v.image_credit));
  const events = (v.events ?? []).filter((e) => e.event);

  // Capacity is only ever shown in the unit the source actually stated.
  const capacities = [
    v.capacity_teu ? { label: 'Container capacity', value: `${num(v.capacity_teu)} TEU` } : null,
    v.passenger_capacity ? { label: 'Passenger capacity', value: `${num(v.passenger_capacity)}` } : null,
    v.deadweight_tons ? { label: 'Deadweight', value: `${num(v.deadweight_tons)} t` } : null,
    v.lane_metres ? { label: 'Lane metres', value: `${num(v.lane_metres)} m` } : null,
    v.cubic_metres ? { label: 'Tank capacity', value: `${num(v.cubic_metres)} m³` } : null,
    v.capacity_value && v.capacity_unit && !v.capacity_teu && !v.passenger_capacity
      ? { label: 'Maximum capacity', value: `${num(v.capacity_value)} ${v.capacity_unit}` }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <script {...jsonLdProps(vesselJsonLd(v, path, typeLabel(v.vessel_type)))} />
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Ships', path: 'ships' },
        { label: v.name, path },
      ]))} />

      {/* ── Masthead: the photograph, or type set on ink ──────────────────────── */}
      {/*
        The masthead image is whatever the source holds for this vessel, and that is not
        always a clean broadside photograph — for Prelude FLNG it is a labelled German
        cutaway diagram. We cannot tell a photograph from a schematic from the metadata,
        so the treatment has to stay legible over ANY image: a fixed hero height so the
        crop is predictable rather than driven by text length, and a scrim heavy enough
        that white diagram panels cannot swallow white type.
      */}
      <header className={showPhoto ? 'relative min-h-[420px] bg-wsd-ink sm:min-h-[520px]' : 'wsd-ink-field'}>
        {showPhoto ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo ?? ''}
              alt={v.name}
              className="absolute inset-0 h-full w-full object-cover opacity-60"
            />
            <div aria-hidden className="absolute inset-0 bg-wsd-ink/45" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-wsd-ink via-wsd-ink/85 to-transparent" />
          </>
        ) : null}

        <div className={`relative mx-auto flex max-w-[1340px] flex-col px-6 pb-12 pt-8 text-white ${showPhoto ? 'min-h-[420px] sm:min-h-[520px]' : ''}`}>
          <nav aria-label="Breadcrumb" className="mb-10">
            <ol className="flex flex-wrap items-center gap-x-2 text-[13px] text-white/60">
              <li><Link href={href()} className="underline-offset-4 hover:text-white hover:underline">Directory</Link></li>
              <li aria-hidden>/</li>
              <li><Link href={href('ships')} className="underline-offset-4 hover:text-white hover:underline">Ships</Link></li>
              <li aria-hidden>/</li>
              <li className="text-white/85" aria-current="page">{v.name}</li>
            </ol>
          </nav>

          <div className={showPhoto ? 'mt-auto' : ''}>
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow className="!text-white/60">{typeLabel(v.vessel_type)}</Eyebrow>
              {v.status === 'under_construction' ? (
                <span className="bg-wsd-vermilion px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                  Not yet delivered
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-[40px] font-extrabold leading-[1.03] tracking-[-0.035em] sm:text-[60px]">
              {v.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-white/80">
              {v.imo_number ? <span data-figure><span className="text-white/50">IMO</span> {v.imo_number}</span> : null}
              {v.mmsi ? <span data-figure><span className="text-white/50">MMSI</span> {v.mmsi}</span> : null}
              {v.call_sign ? <span data-figure><span className="text-white/50">Call sign</span> {v.call_sign}</span> : null}
              {v.flag_country ? (
                v.flag_slug ? (
                  <Link href={href(`flags/${v.flag_slug}`)} className="underline-offset-4 hover:underline">
                    {v.flag_country}
                  </Link>
                ) : <span>{v.flag_country}</span>
              ) : null}
              {v.year_built ? <span>Built {v.year_built}</span> : null}
            </div>

            {v.carrier_slug ? (
              <p className="mt-6 text-[16px]">
                <span className="text-white/55">Operated by</span>{' '}
                <Link href={href(`companies/${v.carrier_slug}`)} className="font-bold underline underline-offset-4 hover:text-wsd-yellow">
                  {v.carrier_name}
                </Link>
                {v.carrier_capacity_rank ? (
                  <span className="ml-2 bg-wsd-violet px-2 py-0.5 text-[12px] font-bold">
                    #{v.carrier_capacity_rank} by capacity
                  </span>
                ) : null}
              </p>
            ) : v.operator_name || v.owner_name ? (
              <p className="mt-6 text-[16px] text-white/75">
                <span className="text-white/55">Operator on record:</span> {v.operator_name ?? v.owner_name}
              </p>
            ) : null}

            {showPhoto && v.image_credit ? (
              <div className="mt-8 [&_p]:!text-white/45">
                <CreditLine credit={v.image_credit} />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6">
        {/* ── Rank ────────────────────────────────────────────────────────────── */}
        {ranks ? (
          <section className="grid gap-px bg-wsd-line-soft sm:grid-cols-3">
            <Rank label="Largest in this registry" rank={ranks.gt_rank_global} total={ranks.gt_ranked_total} />
            <Rank
              label={`Largest ${typeLabel(v.vessel_type).toLowerCase()}`}
              rank={ranks.gt_rank_in_type}
              total={ranks.type_ranked_total}
              note="of this type with a recorded tonnage"
            />
            {v.carrier_slug ? (
              <Rank
                label="Largest in its fleet"
                rank={ranks.gt_rank_in_fleet}
                total={ranks.fleet_ranked_total}
                note="in this fleet with a recorded tonnage"
              />
            ) : (
              <div className="bg-white p-5">
                <p className="wsd-eyebrow">Fleet rank</p>
                <p data-figure className="mt-2 text-[34px] font-extrabold leading-none text-wsd-line">—</p>
                <p className="mt-2 text-[12.5px] text-wsd-muted">No operator attributed to this ship</p>
              </div>
            )}
          </section>
        ) : (
          <p className="border-l-[3px] border-wsd-line bg-wsd-ground-alt px-5 py-4 text-[14.5px] text-wsd-body">
            No gross tonnage is recorded for this vessel, so it cannot be ranked by size. Rank is only
            shown where the underlying measurement exists.
          </p>
        )}

        {/* ── In brief ────────────────────────────────────────────────────────── */}
        {v.summary ? (
          <section className="mt-20">
            <SectionHead
              eyebrow="In brief"
              title={`About ${v.name}`}
              aside={v.wikipedia_url ? (
                <a href={v.wikipedia_url} target="_blank" rel="noreferrer" className="wsd-link">Full article ↗</a>
              ) : null}
            />
            <div className="max-w-3xl">
              <QuotedSummary summary={v.summary} url={v.wikipedia_url} title={v.wikipedia_title} />
            </div>
          </section>
        ) : null}

        {/* ── Particulars ─────────────────────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead
            eyebrow="Vessel particulars"
            title="Identification and dimensions"
            note="Every value is as recorded in the source. Blanks are values the source does not hold — none is estimated from a sister ship or a class average."
          />
          <div className="grid gap-10 lg:grid-cols-3">
            <div>
              <Eyebrow className="mb-3">Identification</Eyebrow>
              <dl>
                <Field label="IMO number"><span className="font-mono">{v.imo_number}</span></Field>
                <Field label="IMO check digit">
                  {checkDigitValid === undefined ? null : checkDigitValid ? 'Valid' : 'Does not validate'}
                </Field>
                <Field label="MMSI"><span className="font-mono">{v.mmsi}</span></Field>
                <Field label="Call sign"><span className="font-mono">{v.call_sign}</span></Field>
                <Field label="Flag state">{v.flag_country}</Field>
                <Field label="Port of registry">{v.home_port}</Field>
                <Field label="Vessel class">{v.vessel_class}</Field>
                <Field label="Status">{v.status ? v.status.replace(/_/g, ' ') : null}</Field>
                {nameLanguage ? (
                  <Field label="Name recorded in">
                    <span title="This ship has no English label; the name shown is the one recorded in this language.">
                      {nameLanguage}
                    </span>
                  </Field>
                ) : null}
              </dl>
            </div>

            <div>
              <Eyebrow className="mb-3">Construction</Eyebrow>
              <dl>
                <Field label="Type">{typeLabel(v.vessel_type)}</Field>
                <Field label="Builder">
                  {v.builder_name ? (
                    v.builder_slug ? (
                      <Link href={href(`builders/${v.builder_slug}`)} className="wsd-link">{v.builder_name}</Link>
                    ) : v.builder_name
                  ) : null}
                </Field>
                <Field label="Yard number"><span className="font-mono">{v.yard_number}</span></Field>
                <Field label="Launched">{v.launched_year}</Field>
                <Field label="Year built">{v.year_built}</Field>
                <Field label="Designed to carry">{v.designed_to_carry}</Field>
                <Field label="Owner">{v.owner_name}</Field>
                <Field label="Operator on record">{v.operator_name}</Field>
              </dl>
            </div>

            <div>
              <Eyebrow className="mb-3">Measurements</Eyebrow>
              <dl>
                <Field label="Gross tonnage">{num(v.gross_tonnage)}</Field>
                <Field label="Net tonnage">{num(v.net_tonnage)}</Field>
                <Field label="Displacement">{v.displacement_t ? `${num(v.displacement_t)} t` : null}</Field>
                <Field label="Length overall">{v.length_m ? `${dec(v.length_m)} m` : null}</Field>
                <Field label="Beam">{v.beam_m ? `${dec(v.beam_m)} m` : null}</Field>
                <Field label="Draft">{v.draft_m ? `${dec(v.draft_m)} m` : null}</Field>
                <Field label="Service speed">{v.service_speed_knots ? `${dec(v.service_speed_knots)} kn` : null}</Field>
                {capacities.map((c) => (
                  <Field key={c.label} label={c.label}>{c.value}</Field>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {context ? <VesselComparison vessel={v} context={context} /> : null}

        {/* ── Timeline ────────────────────────────────────────────────────────── */}
        {events.length ? (
          <section className="mt-20">
            <SectionHead
              eyebrow="Record"
              title="Notable events"
              note="Events recorded against this vessel in the source, with the dates the source gives. An event with no date is listed last rather than assigned one."
            />
            <ol className="max-w-2xl">
              {events.map((e, i) => (
                <li key={`${e.qid ?? e.event}-${i}`} className="flex gap-6 border-b border-wsd-line-soft py-3 last:border-0">
                  <span data-figure className="w-16 shrink-0 font-bold text-wsd-violet">
                    {e.year ?? <span className="text-wsd-line">—</span>}
                  </span>
                  <span className="text-[15px] text-wsd-body">{e.event}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* ── Sisters ─────────────────────────────────────────────────────────── */}
        {sisters.length ? (
          <section className="mt-20">
            <SectionHead
              eyebrow="Class"
              title={`Sister ships in the ${v.vessel_class} class`}
              aside={`${sisters.length} on record`}
            />
            <TableShell minWidth={620}>
              <thead>
                <tr className="border-b border-wsd-ink">
                  <Th>Ship</Th>
                  <Th>IMO</Th>
                  <Th>Flag</Th>
                  <Th align="right">Built</Th>
                  <Th align="right">Gross tonnage</Th>
                </tr>
              </thead>
              <tbody>
                {sisters.map((s) => (
                  <tr key={s.slug} className="border-b border-wsd-line-soft last:border-0 hover:bg-wsd-ground-alt">
                    <td className="px-4 py-2.5">
                      <Link href={href(`ships/${s.slug}`)} className="font-bold text-wsd-ink hover:text-wsd-violet">{s.name}</Link>
                    </td>
                    <td className="px-4 py-2.5 text-wsd-body">{s.imo_number ?? '—'}</td>
                    <td className="px-4 py-2.5 text-wsd-body">{s.flag_country ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right">{s.year_built ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{num(s.gross_tonnage) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </section>
        ) : yardMates.length ? (
          <section className="mt-20">
            <SectionHead
              eyebrow="Same yard, same years"
              title={`Built alongside at ${v.builder_name}`}
              note="No ship class is recorded for this vessel, so these are not asserted to be sister ships — they are contemporaries from the same builder, shown because that is what the data supports."
            />
            <ShipStrip ships={yardMates} />
          </section>
        ) : null}

        {/* ── Fleet mates ─────────────────────────────────────────────────────── */}
        {fleetMates.length && v.carrier_slug ? (
          <section className="mt-20">
            <SectionHead
              eyebrow="Same fleet"
              title={`Other ships operated by ${v.carrier_name}`}
              aside={<Link href={href(`companies/${v.carrier_slug}`)} className="wsd-link">Full fleet →</Link>}
            />
            <ShipStrip ships={fleetMates} />
          </section>
        ) : null}

        {/* ── Sources ─────────────────────────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead eyebrow="Provenance" title="Where this page comes from" />
          <div className="grid gap-6 text-[14px] leading-relaxed text-wsd-body sm:grid-cols-3">
            <p>
              <strong className="block font-bold text-wsd-ink">Vessel record</strong>
              {v.source_url ? (
                <a href={v.source_url} target="_blank" rel="noreferrer" className="wsd-link">Wikidata</a>
              ) : 'Wikidata'}, released under CC0, keyed on this ship&rsquo;s IMO number.
            </p>
            <p>
              <strong className="block font-bold text-wsd-ink">Written summary</strong>
              {v.wikipedia_url ? (
                <>
                  Quoted from{' '}
                  <a href={v.wikipedia_url} target="_blank" rel="noreferrer" className="wsd-link">{v.wikipedia_title}</a>
                  {' '}on English Wikipedia, reused under CC BY-SA 4.0.
                </>
              ) : 'No English Wikipedia article is linked to this vessel, so no summary is shown.'}
            </p>
            <p>
              <strong className="block font-bold text-wsd-ink">Photograph</strong>
              {showPhoto && v.image_credit
                ? <>By {v.image_credit.author ?? 'an unnamed photographer'}, reused under {v.image_credit.licence}.</>
                : 'No freely licensed photograph of this vessel is held, so none is shown.'}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Chip href={`${href('ships')}?type=${encodeURIComponent(v.vessel_type)}`}>
              All {typeLabel(v.vessel_type).toLowerCase()}s
            </Chip>
            {v.flag_country && v.flag_slug ? (
              <Chip href={href(`flags/${v.flag_slug}`)}>Ships flagged {v.flag_country}</Chip>
            ) : null}
            {v.builder_name && v.builder_slug ? (
              <Chip href={href(`builders/${v.builder_slug}`)}>Built by {v.builder_name}</Chip>
            ) : null}
            {v.carrier_slug ? <Chip href={href(`companies/${v.carrier_slug}`)}>{v.carrier_name}</Chip> : null}
          </div>
        </section>
      </div>
    </>
  );
}
