/**
 * "How this ship compares" — the section that makes a bare vessel page worth reading.
 *
 * WHY THIS EXISTS. 52,364 of the registry's 95,871 hulls have no photograph, no written
 * summary, no builder and no operator. Their pages were a name, an IMO number and a flag
 * on a shared template: about 40 words that differ from the next page. Nothing indexes
 * that, and tens of thousands of them is what gets a site classed as scaled content.
 *
 * The answer is not to pad every page with the same 900 words explaining what a bulk
 * carrier is — boilerplate repeated across 6,890 pages contributes nothing to any of them
 * and makes the duplication worse. The answer is content that is genuinely DIFFERENT on
 * every page, and the registry already contains it: where this hull sits among the ships
 * of its type, its flag, its build year and its builder is a different set of numbers for
 * all 95,871 rows.
 *
 * EVERY SENTENCE BELOW IS ASSEMBLED FROM A COUNT, A RANK OR A PERCENTILE OVER REAL ROWS.
 * There is no generated prose, no filler and no estimate. Where a measurement is missing
 * the paragraph that would have used it is not rendered — a ship with no recorded tonnage
 * gets no size comparison, and the page says the measurement is absent instead of placing
 * the ship somewhere plausible.
 */
import Link from 'next/link';
import {
  num, dec, typeLabel,
  type Vessel, type VesselContext, type Company, type CarrierContext,
} from '@/lib/shipping-directory/api';
import { href } from '@/lib/shipping-directory/site';
import { SectionHead, Eyebrow, TableShell, Th } from './ui';

/** How a cohort should be named in a sentence. `other` is not a type, it is our gap. */
function cohortNoun(type: string, plural = true): string {
  if (type === 'other') {
    return plural
      ? 'vessels this registry holds no type classification for'
      : 'vessel this registry holds no type classification for';
  }
  const label = typeLabel(type).toLowerCase();
  return plural ? `${label}s` : label;
}

/** "5.4 times" / "a third of" — a ratio a reader can hold in their head. */
function ratioPhrase(value: number, reference: number): string | null {
  if (!reference || !Number.isFinite(value / reference)) return null;
  const r = value / reference;
  if (r >= 1.15) return `about ${r >= 10 ? Math.round(r) : r.toFixed(1)} times`;
  if (r <= 0.85) return `about ${(1 / r) >= 10 ? Math.round(1 / r) : (1 / r).toFixed(1)} times smaller than`;
  return null;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${num(n)}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export function VesselComparison({ vessel: v, context }: { vessel: Vessel; context: VesselContext }) {
  const c = context?.cohorts ?? {};
  const global = c.global;
  const type = c.type;
  const flag = c.flag;
  const year = c.year;
  const decade = c.decade;
  const builder = c.builder;
  const gt = v.gross_tonnage;

  // Nothing to compare against at all — say so rather than render an empty frame.
  if (!global && !type && !flag && !year) return null;

  const paragraphs: React.ReactNode[] = [];

  // ── Size against the whole registry ────────────────────────────────────────
  if (gt != null && global && v.gt_rank_global) {
    const ratio = global.median_gt ? ratioPhrase(gt, Number(global.median_gt)) : null;
    paragraphs.push(
      <p key="global">
        At <strong>{num(gt)} gross tons</strong>, {v.name} is the{' '}
        <strong>{ordinal(v.gt_rank_global)} largest</strong> of the {num(global.with_gt)} vessels in
        this registry that report a tonnage.
        {global.median_gt ? (
          <>
            {' '}The median across that set is {num(global.median_gt)} GT
            {ratio ? <>, so this hull is {ratio} the typical vessel on record here</> : null}.
          </>
        ) : null}
        {global.max_gt ? <> The largest measures {num(global.max_gt)} GT.</> : null}
      </p>,
    );
  }

  // ── Within its own type ────────────────────────────────────────────────────
  if (type && v.gt_rank_in_type && gt != null) {
    const pct = v.gt_pct_in_type != null ? Number(v.gt_pct_in_type) : null;
    paragraphs.push(
      <p key="type">
        Among the <strong>{num(type.n)} {cohortNoun(v.vessel_type)}</strong> held here, it ranks{' '}
        <strong>{ordinal(v.gt_rank_in_type)}</strong> by tonnage
        {pct != null ? (
          <> — larger than {pct.toFixed(0)}% of that group</>
        ) : null}
        .{' '}
        {type.median_gt ? <>Their median tonnage is {num(type.median_gt)} GT</> : null}
        {type.p90_gt ? <>, and the largest tenth begin at {num(type.p90_gt)} GT</> : null}
        {type.median_gt ? '. ' : ''}
        {type.top_flag ? (
          <>The flag most often flown by this group is {type.top_flag} ({num(type.top_flag_n)} ships).</>
        ) : null}
        {type.top_builder ? (
          <> The yard that appears most often against it is {type.top_builder}, with{' '}
            {num(type.top_builder_n)} hulls on record.</>
        ) : null}
      </p>,
    );
  }

  // ── Flag state ─────────────────────────────────────────────────────────────
  if (flag && v.flag_country) {
    paragraphs.push(
      <p key="flag">
        {v.flag_country} is the country of registry for <strong>{num(flag.n)} vessels</strong> in
        this directory
        {v.gt_rank_in_flag ? (
          <>, of which {v.name} is the {ordinal(v.gt_rank_in_flag)} largest by tonnage</>
        ) : null}
        .{' '}
        {flag.top_type ? (
          <>The most common class under that flag is {cohortNoun(flag.top_type)} ({num(flag.top_type_n)} ships)
            {flag.median_gt ? <>, and the median vessel measures {num(flag.median_gt)} GT</> : null}.</>
        ) : null}{' '}
        {v.flag_slug ? (
          <Link href={href(`flags/${v.flag_slug}`)} className="wsd-link">
            Browse every ship flagged {v.flag_country}
          </Link>
        ) : null}
        {v.flag_slug ? '.' : null}
      </p>,
    );
  }

  // ── Flag and type together — narrower than either alone ────────────────────
  const cross = context.crossFlagType;
  if (cross && cross.n > 1 && v.flag_country && v.vessel_type) {
    paragraphs.push(
      <p key="cross">
        Narrowing to both dimensions at once, this registry holds{' '}
        <strong>{num(cross.n)} {cohortNoun(v.vessel_type)} flying the {v.flag_country} flag</strong>
        {gt != null ? (
          <>, of which {cross.larger === 0
            ? <>none is larger than {v.name}</>
            : <>{num(cross.larger)} {cross.larger === 1 ? 'is' : 'are'} larger by tonnage</>}</>
        ) : null}
        .
      </p>,
    );
  }

  // ── Build year and generation ──────────────────────────────────────────────
  if (year && v.year_built) {
    const age = new Date().getFullYear() - v.year_built;
    paragraphs.push(
      <p key="year">
        {v.name} was built in <strong>{v.year_built}</strong>, making it {age} year{age === 1 ? '' : 's'} old.
        It is one of <strong>{num(year.n)} hulls</strong> in this registry delivered that year
        {year.median_gt ? <>, a cohort whose median tonnage is {num(year.median_gt)} GT</> : null}
        {v.gt_rank_in_year ? <>; within it this ship is the {ordinal(v.gt_rank_in_year)} largest</> : null}.
        {decade ? (
          <>
            {' '}Across the whole of the {decade.cohort_key}s the registry holds {num(decade.n)} vessels
            {decade.median_gt ? <>, median {num(decade.median_gt)} GT</> : null}.
          </>
        ) : null}
        {global?.median_year ? (
          <> The median build year across the entire registry is {global.median_year}.</>
        ) : null}
      </p>,
    );
  }

  // ── Builder ────────────────────────────────────────────────────────────────
  if (builder && v.builder_name) {
    paragraphs.push(
      <p key="builder">
        The registry attributes <strong>{num(builder.n)} vessels</strong> to {v.builder_name}
        {builder.median_gt ? <>, with a median tonnage of {num(builder.median_gt)} GT</> : null}
        {builder.oldest_year && builder.newest_year ? (
          <>, delivered between {builder.oldest_year} and {builder.newest_year}</>
        ) : null}
        .{' '}
        {v.builder_slug ? (
          <Link href={href(`builders/${v.builder_slug}`)} className="wsd-link">
            See the rest of that yard&rsquo;s output
          </Link>
        ) : null}
        {v.builder_slug ? '.' : null}
      </p>,
    );
  }

  // ── Dimensions against the type median ─────────────────────────────────────
  if (v.length_m && type?.median_length) {
    const len = Number(v.length_m);
    const med = Number(type.median_length);
    const diff = len - med;
    paragraphs.push(
      <p key="dims">
        At {dec(v.length_m)} m overall, {v.name} is{' '}
        {Math.abs(diff) < 1 ? (
          <>within a metre of the {dec(med)} m median length for {cohortNoun(v.vessel_type)} on record</>
        ) : (
          <>
            {dec(Math.abs(diff))} m {diff > 0 ? 'longer' : 'shorter'} than the {dec(med)} m median for{' '}
            {cohortNoun(v.vessel_type)} on record
          </>
        )}
        {v.beam_m ? <>, with a beam of {dec(v.beam_m)} m</> : null}
        {v.draft_m ? <> and a draft of {dec(v.draft_m)} m</> : null}.
      </p>,
    );
  }

  /**
   * The IMO number, worked through.
   *
   * Unique to the hull (it is arithmetic on its own digits), verifiable by the reader, and
   * it answers "what is an IMO number" — a question people actually search — without
   * repeating a paragraph of definition that would be identical on 95,871 pages.
   */
  const imo = v.imo_number && /^\d{7}$/.test(v.imo_number) ? v.imo_number : null;
  const imoWorking = imo
    ? Array.from({ length: 6 }, (_, i) => ({ digit: Number(imo[i]), weight: 7 - i }))
    : null;
  const imoSum = imoWorking ? imoWorking.reduce((t, x) => t + x.digit * x.weight, 0) : null;

  /**
   * Where this hull sits in the IMO series.
   *
   * Stated as what it is — what ELSE holds a nearby number — never as a claim about this
   * ship's own age. IMO numbers are issued in broadly chronological blocks, so the
   * neighbourhood is informative; treating it as this vessel's build date would be an
   * inference the data does not support.
   */
  const series = context.imoSeries;
  if (series && series.n > 1) {
    paragraphs.push(
      <p key="series">
        IMO numbers are issued in broadly chronological blocks. Within {series.window} either side
        of {v.imo_number} this registry holds <strong>{num(series.n)} other vessels</strong>
        {series.median_year ? (
          <>, whose median build year is {series.median_year}</>
        ) : null}
        {series.oldest && series.newest && series.oldest !== series.newest ? (
          <> and which range from {series.oldest} to {series.newest}</>
        ) : null}
        . That places this hull&rsquo;s registration in the same part of the series
        {v.year_built ? <>, consistent with its recorded build year of {v.year_built}</> : null}
        {!v.year_built ? <>; no build year is recorded for this vessel itself</> : null}.
      </p>,
    );
  }

  if (!paragraphs.length && !imoWorking) return null;

  const neighbours = [
    ...(context.neighbours?.larger ?? []).map((n) => ({ ...n, rel: 'larger' as const })),
    { ...v, rel: 'self' as const },
    ...(context.neighbours?.smaller ?? []).map((n) => ({ ...n, rel: 'smaller' as const })),
  ];

  return (
    <section className="mt-20">
      <SectionHead
        eyebrow="In context"
        title={`How ${v.name} compares`}
        note="Every figure in this section is a count, a rank or a percentile over vessels actually held in this registry — not over the world fleet, which is larger. Nothing here is estimated."
      />

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div className="max-w-2xl space-y-4 text-[16px] leading-[1.65] text-wsd-body">
          {paragraphs}

          {imoWorking && imoSum != null ? (
            <p>
              Its IMO number, <strong>{imo}</strong>, carries its own check digit. The first six
              digits are weighted seven down to two and summed —{' '}
              {imoWorking.map((x, i) => (
                <span key={i}>{i > 0 ? ' + ' : ''}{x.digit}&times;{x.weight}</span>
              ))}{' '}= {imoSum} — and the last digit of that total, {imoSum % 10}, must equal the
              seventh digit, {imo![6]}.{' '}
              {imoSum % 10 === Number(imo![6])
                ? 'It does, so this number is well formed.'
                : 'It does not, so this number as recorded does not validate; it is shown here as held rather than silently corrected.'}
            </p>
          ) : null}
        </div>

        {/* The claim above, made checkable: the named hulls either side of this one. */}
        {neighbours.length > 1 ? (
          <div>
            <Eyebrow className="mb-3">
              Nearest by tonnage among {cohortNoun(v.vessel_type)}
            </Eyebrow>
            <TableShell minWidth={320}>
              <thead>
                <tr className="border-b border-wsd-ink">
                  <Th>Ship</Th>
                  <Th align="right">Built</Th>
                  <Th align="right">Gross tonnage</Th>
                </tr>
              </thead>
              <tbody>
                {neighbours.map((n) => (
                  <tr
                    key={n.slug}
                    className={`border-b border-wsd-line-soft last:border-0 ${
                      n.rel === 'self' ? 'bg-wsd-violet-wash' : 'hover:bg-wsd-ground-alt'
                    }`}
                  >
                    <td className="px-4 py-2">
                      {n.rel === 'self' ? (
                        <span className="font-bold text-wsd-violet">{n.name} (this ship)</span>
                      ) : (
                        <Link href={href(`ships/${n.slug}`)} className="font-semibold text-wsd-ink hover:text-wsd-violet">
                          {n.name}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-wsd-body">{n.year_built ?? '—'}</td>
                    <td className="px-4 py-2 text-right font-semibold">{num(n.gross_tonnage) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
        ) : (series && series.adjacent.length ? (
          <div>
            <Eyebrow className="mb-3">Nearest by IMO number</Eyebrow>
            <TableShell minWidth={320}>
              <thead>
                <tr className="border-b border-wsd-ink">
                  <Th>Ship</Th>
                  <Th align="right">IMO</Th>
                  <Th align="right">Built</Th>
                </tr>
              </thead>
              <tbody>
                {series.adjacent.map((n) => (
                  <tr key={n.slug} className="border-b border-wsd-line-soft last:border-0 hover:bg-wsd-ground-alt">
                    <td className="px-4 py-2">
                      <Link href={href(`ships/${n.slug}`)} className="font-semibold text-wsd-ink hover:text-wsd-violet">
                        {n.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right text-wsd-body">{n.imo_number ?? '—'}</td>
                    <td className="px-4 py-2 text-right text-wsd-body">{n.year_built ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
        ) : null)}
      </div>
    </section>
  );
}

/**
 * "How this operator compares" — the company-page equivalent.
 *
 * Same principle and same discipline as VesselComparison: a company page holding a name,
 * a country and a fleet count is thin, and what makes it specific is its position among
 * peers. Every figure is a count over carriers actually held. A company with no fleet
 * gets no fleet comparison rather than a placeholder rank.
 */
export function CompanyComparison({ company: c, context }: { company: Company; context: CarrierContext }) {
  const reg = context?.registry;
  const country = context?.country;
  const era = context?.sameEra;
  if (!reg) return null;

  const paragraphs: React.ReactNode[] = [];

  if (c.registry_vessel_count > 0 && c.fleet_rank_global) {
    paragraphs.push(
      <p key="fleet">
        With <strong>{num(c.registry_vessel_count)} vessels</strong> attributed to it here,{' '}
        {c.name} is the <strong>{ordinal(c.fleet_rank_global)} largest</strong> of the{' '}
        {num(reg.with_fleet)} operators in this directory that hold at least one ship on record
        {reg.median_fleet ? <>, against a median of {num(reg.median_fleet)} across that group</> : null}.
        {' '}That is a count of individually identified hulls, not the company&rsquo;s published
        fleet size — the two are different measurements and both are shown above where available.
      </p>,
    );
  } else if (c.reported_fleet_size) {
    paragraphs.push(
      <p key="fleet-reported">
        No individual vessel in this registry currently names {c.name} as its operator, so it has no
        counted fleet here. Its published figure of <strong>{num(c.reported_fleet_size)} ships</strong>{' '}
        is shown above with the source that reported it. Of the {num(reg.n)} commercial operators on
        record, {num(reg.with_fleet)} have at least one ship individually attributed.
      </p>,
    );
  }

  if (country && c.country) {
    paragraphs.push(
      <p key="country">
        {c.country} is the country of registration for <strong>{num(country.n)} commercial
        operators</strong> in this directory
        {c.fleet_rank_in_country && c.country_carrier_count ? (
          <>, among which {c.name} ranks {ordinal(c.fleet_rank_in_country)} by ships on record</>
        ) : null}
        .{' '}
        {country.fleet ? <>Between them those companies hold {num(country.fleet)} vessels here.</> : null}
        {country.ranked ? <> {num(country.ranked)} of them carry a published container-capacity ranking.</> : null}
        {' '}
        {c.country_code ? (
          <Link href={href(`countries/${c.country_code.toLowerCase()}`)} className="wsd-link">
            See every operator registered in {c.country}
          </Link>
        ) : null}
        {c.country_code ? '.' : null}
      </p>,
    );
  }

  if (c.founded_year && era && era.n > 1) {
    const age = new Date().getFullYear() - c.founded_year;
    paragraphs.push(
      <p key="era">
        Founded in <strong>{c.founded_year}</strong>, {c.name} is {age} years old. This directory
        holds <strong>{num(era.n)} operators</strong> founded within five years either side of that
        date{era.median_fleet != null ? <>, whose median fleet on record is {num(era.median_fleet)} ships</> : null}.
        {reg.median_founded ? <> The median founding year across all commercial operators here is {reg.median_founded}</> : null}
        {reg.oldest_founded ? <>, and the oldest on record dates to {reg.oldest_founded}</> : null}
        {reg.median_founded ? '.' : null}
      </p>,
    );
  }

  if (!paragraphs.length) return null;

  return (
    <section className="mt-20">
      <SectionHead
        eyebrow="In context"
        title={`How ${c.name} compares`}
        note="Counts over companies and vessels actually held in this directory — not over the world fleet, which is larger. Nothing here is estimated."
      />
      <div className="max-w-3xl space-y-4 text-[16px] leading-[1.65] text-wsd-body">{paragraphs}</div>
    </section>
  );
}
