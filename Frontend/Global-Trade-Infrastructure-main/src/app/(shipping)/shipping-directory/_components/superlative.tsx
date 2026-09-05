/**
 * Superlative list pages — "the largest ships", "the largest bulk carriers".
 *
 * WHY. These are the head queries of the niche this directory can actually win. The free
 * competition for "ships built by X" is a Wikipedia category listing 118 blue links; for
 * "largest ships in the world" it is a prose article with a handful of examples. A
 * sortable, sourced, quantified table over 95,871 hulls beats both, and the data is
 * already indexed for it.
 *
 * THE HONESTY PROBLEM, AND HOW IT IS HANDLED. The query is "largest in the world"; what we
 * can prove is "largest in this registry". Those are not the same claim and the page must
 * not blur them. So the heading says what it is, and a standing note states the coverage
 * plainly: the registry holds IMO-numbered vessels from open reference data, which is
 * comprehensive at the top of the size range and thinner below it. A reader is told what
 * the list is a list OF, and can judge it.
 */
import Link from 'next/link';
import { num, dec, typeLabel, type Vessel } from '@/lib/shipping-directory/api';
import { href, commonsImage } from '@/lib/shipping-directory/site';
import { SectionHead, Eyebrow, TableShell, Th, Breadcrumbs, Chip } from './ui';

export interface SuperlativeStats {
  total: number;
  withMeasure: number;
  biggest: number | null;
  median: number | null;
}

export function SuperlativeList({
  vessels, stats, type, siblings, measure = 'tonnage',
}: {
  vessels: Vessel[];
  stats: SuperlativeStats;
  /** null = the whole registry; otherwise a vessel_type key. */
  type: string | null;
  siblings: { vessel_type: string; n: number }[];
  measure?: 'tonnage' | 'age';
}) {
  const isAge = measure === 'age';
  const noun = type ? `${typeLabel(type).toLowerCase()}s` : 'vessels';
  const heading = isAge
    ? `The oldest ${noun} still on record`
    : `The largest ${noun} by gross tonnage`;

  const trail = [
    { label: 'Directory', href: href() },
    { label: isAge ? 'Oldest ships' : 'Largest ships', href: isAge ? href('oldest') : href('largest') },
    ...(type ? [{ label: typeLabel(type) }] : []),
  ];
  // The last crumb must not be a link when it is the current page.
  if (!type) delete (trail[1] as { href?: string }).href;

  return (
    <>
      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 py-12">
          <div className="mb-8 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/85 [&_li]:text-white/40">
            <Breadcrumbs trail={trail} />
          </div>
          <Eyebrow className="!text-white/60">{isAge ? 'By age' : 'By size'}</Eyebrow>
          <h1 className="mt-3 max-w-4xl text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-[54px]">
            {heading}
          </h1>

          <p className="mt-5 max-w-3xl text-[16.5px] leading-relaxed text-white/80">
            Ranked across the {num(stats.total)} {type ? noun : 'vessels'} this registry holds
            {isAge
              ? ', by the build year recorded for each.'
              : `, of which ${num(stats.withMeasure)} report a gross tonnage.`}
            {!isAge && stats.biggest ? (
              <> The largest measures <strong>{num(stats.biggest)} GT</strong>
                {stats.median ? <>, against a median of {num(stats.median)} GT for the group</> : null}.
              </>
            ) : null}
          </p>

          {/* The claim boundary, stated rather than implied. */}
          <p className="mt-4 max-w-3xl border-l-[3px] border-wsd-yellow pl-4 text-[14px] leading-relaxed text-white/65">
            This is the largest in <strong className="text-white/90">this registry</strong>, not a
            claim about the world fleet. The registry is built from open reference data keyed on IMO
            number; coverage is close to complete at the top of the size range, where every hull is
            documented, and thinner among small craft. Where a vessel reports no tonnage it cannot be
            ranked and does not appear.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1340px] px-6 py-12">
        <SectionHead
          eyebrow="Ranked"
          title={isAge ? 'Oldest first' : 'Largest first'}
          aside={type ? <Link href={href(`ships/type/${type}`)} className="wsd-link">All {noun} →</Link> : null}
        />

        <TableShell minWidth={1040}>
          <thead>
            <tr className="border-b border-wsd-ink">
              <Th>#</Th>
              <Th>Ship</Th>
              <Th>IMO</Th>
              {!type ? <Th>Type</Th> : null}
              <Th>Flag</Th>
              <Th>Operator</Th>
              <Th align="right">Built</Th>
              <Th align="right">Gross tonnage</Th>
              <Th align="right">Length</Th>
            </tr>
          </thead>
          <tbody>
            {vessels.map((v, i) => (
              <tr key={v.slug} className="border-b border-wsd-line-soft last:border-0 hover:bg-wsd-ground-alt">
                <td className="px-4 py-2.5 font-bold text-wsd-violet">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {v.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={commonsImage(v.image_url, 140) ?? ''} alt="" loading="lazy" className="h-10 w-16 shrink-0 border border-wsd-line-soft object-cover" />
                    ) : (
                      <span aria-hidden className="h-10 w-16 shrink-0 border border-wsd-line-soft bg-wsd-ground-mid" />
                    )}
                    <Link href={href(`ships/${v.slug}`)} className="font-bold text-wsd-ink hover:text-wsd-violet">{v.name}</Link>
                    {/* A hull whose entry into service is still ahead of it must not sit in
                        a ranking of ships on record without saying so. */}
                    {v.status === 'under_construction' ? (
                      <span className="shrink-0 border border-wsd-vermilion px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-wsd-vermilion">
                        On order
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-wsd-body">{v.imo_number ?? '—'}</td>
                {!type ? <td className="px-4 py-2.5 text-wsd-body">{typeLabel(v.vessel_type)}</td> : null}
                <td className="px-4 py-2.5 text-wsd-body">{v.flag_country ?? '—'}</td>
                <td className="px-4 py-2.5 text-wsd-body">
                  {v.carrier_slug ? (
                    <Link href={href(`companies/${v.carrier_slug}`)} className="wsd-link">{v.carrier_name}</Link>
                  ) : (v.operator_name ?? v.owner_name ?? '—')}
                </td>
                <td className="px-4 py-2.5 text-right">{v.year_built ?? '—'}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{num(v.gross_tonnage) ?? '—'}</td>
                <td className="px-4 py-2.5 text-right text-wsd-body">{v.length_m ? `${dec(v.length_m)} m` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>

        {siblings.length ? (
          <section className="mt-16">
            <SectionHead
              eyebrow="By class of ship"
              title={isAge ? 'Oldest of each type' : 'Largest of each type'}
              note="The same ranking, narrowed to one kind of vessel."
            />
            <div className="flex flex-wrap gap-2">
              {type ? (
                <Chip href={isAge ? href('oldest') : href('largest')} tone="outline">
                  All vessel types
                </Chip>
              ) : null}
              {siblings.map((t) => (
                t.vessel_type === type ? null : (
                  <Link
                    key={t.vessel_type}
                    href={`${isAge ? href('oldest') : href('largest')}/${t.vessel_type}`}
                    className="inline-flex items-baseline gap-2 border border-wsd-line-soft px-3 py-1.5 text-[13.5px] font-semibold text-wsd-body transition-colors hover:border-wsd-violet hover:text-wsd-violet"
                  >
                    {typeLabel(t.vessel_type)}
                    <span data-figure className="text-[12px] text-wsd-muted">{num(t.n)}</span>
                  </Link>
                )
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
