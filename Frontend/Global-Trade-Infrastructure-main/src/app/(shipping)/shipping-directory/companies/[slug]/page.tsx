/**
 * @file companies/[slug]/page.tsx
 * @description One shipping company in full.
 *
 * The page answers, in order, the questions a reader actually arrives with: what is this
 * company, who created it, who runs it, who owns it, what does it earn, what does it
 * sail, and what has it delivered. Every section renders only when its data exists —
 * there are no empty scaffolds, and nothing is written to fill a gap.
 *
 * The masthead leads with BOTH fleet numbers rather than choosing one. For a major line
 * they differ by roughly twentyfold, and the honest presentation is to show each with
 * what it measures, not to quietly prefer whichever flatters the page.
 */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getCompany, listCompanyVessels, num, pct, dec, money, typeLabel,
  type DirectoryOrg, type Vessel, type CompanyProfile,
} from '@/lib/shipping-directory/api';
import { href, canonical, commonsImage } from '@/lib/shipping-directory/site';
import { organizationJsonLd, breadcrumbJsonLd, jsonLdProps } from '@/lib/shipping-directory/jsonld';
import {
  Field, Figure, BarRow, TypeChip, Chip, EmptyState, SectionHead, Eyebrow,
  TableShell, Th, Pagination, FleetNumbersNote,
} from '../../_components/ui';
import { Logo, Photo, PersonCard, QuotedSummary } from '../../_components/media';
import { CompanyComparison } from '../../_components/context';

const FLEET_PAGE = 60;

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getCompany(slug);
  if (!profile) return { title: 'Company not found', robots: { index: false, follow: true } };

  const c = profile.company;
  const path = `companies/${slug}`;
  // A description built from what we hold, so no two company pages share boilerplate —
  // duplicated meta descriptions across 1,700 pages is exactly what gets a directory
  // filed as thin content.
  const facts = [
    c.industry || (c.company_type === 'state' ? 'State-operated fleet' : 'Shipping company'),
    c.headquarters || c.country,
    c.founded_year ? `founded ${c.founded_year}` : null,
    c.capacity_rank ? `#${c.capacity_rank} by container capacity` : null,
    c.reported_fleet_size ? `${num(c.reported_fleet_size)} ships reported` : null,
    c.registry_vessel_count ? `${num(c.registry_vessel_count)} on record here` : null,
  ].filter(Boolean).join(' · ');

  const image = commonsImage(c.image_url, 1200) || commonsImage(c.logo_url, 800);

  return {
    title: c.name,
    description: `${c.name} — ${facts}. Founders, leadership, ownership, fleet composition, tonnage, flag states and a ten-year delivery record, each figure shown with its source.`,
    alternates: { canonical: canonical(path) },
    // A company we hold nothing about beyond a name is reachable and crawlable, but not
    // submitted for indexing — 285 such pages sharing one template is thin content at
    // scale, and it costs crawl budget the substantive pages need. `follow` keeps its
    // outbound links working.
    robots: c.is_indexable === false ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: 'profile',
      title: `${c.name} · World Shipping Directory`,
      description: facts,
      url: canonical(path),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

/**
 * Related organisations. Any that this directory holds a page for become links and are
 * listed first — for a group like A.P. Moller-Maersk the ranked container line is one of
 * its subsidiaries, and burying it among terminals and holding companies is what makes a
 * group page look like missing data.
 */
function OrgChips({
  orgs, related, max = 24,
}: {
  orgs: DirectoryOrg[];
  related: CompanyProfile['related'];
  max?: number;
}) {
  const withPages = orgs.filter((o) => o.qid && related[o.qid]);
  const rest = orgs.filter((o) => !o.qid || !related[o.qid]);
  const shown = rest.slice(0, Math.max(0, max - withPages.length));

  return (
    <div className="flex flex-wrap gap-2">
      {withPages.map((o) => {
        const r = related[o.qid!];
        return (
          <Chip key={o.qid} href={href(`companies/${r.slug}`)} tone="outline">
            {r.name}
            {r.capacity_rank ? (
              <span className="text-wsd-violet">#{r.capacity_rank}</span>
            ) : r.registry_vessel_count ? (
              <span className="font-normal text-wsd-muted">{num(r.registry_vessel_count)} ships</span>
            ) : null}
          </Chip>
        );
      })}
      {shown.map((o) => (
        <span key={o.qid ?? o.name} title={o.description ?? undefined}>
          <Chip>{o.name}</Chip>
        </span>
      ))}
      {rest.length > shown.length ? <Chip>+{rest.length - shown.length} more</Chip> : null}
    </div>
  );
}

export default async function CompanyPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const typeFilter = (Array.isArray(sp.type) ? sp.type[0] : sp.type) ?? '';
  const offset = Number((Array.isArray(sp.offset) ? sp.offset[0] : sp.offset) ?? 0) || 0;

  const profile = await getCompany(slug);
  if (!profile) notFound();

  const { company: c, registry, reported, peers = [], related = {}, context } = profile;
  const fleet = await listCompanyVessels(slug, { type: typeFilter, limit: FLEET_PAGE, offset, sort: 'tonnage' });
  const s = registry.summary;
  const path = `companies/${slug}`;

  const founders = c.founders ?? [];
  const people = c.key_people ?? [];
  const executives = people.filter((p) => p.role === 'Chief executive');
  const board = people.filter((p) => p.role !== 'Chief executive');

  const maxType = Math.max(...registry.byType.map((r) => r.n), 0);
  const maxFlag = Math.max(...registry.byFlag.map((r) => r.n), 0);
  const maxBuilder = Math.max(...registry.builders.map((r) => r.n), 0);

  const history = registry.history.filter((h) => h.basis === 'derived');
  const maxDelivered = Math.max(...history.map((h) => h.vessels_delivered), 0);
  const deliveredInWindow = history.reduce((sum, h) => sum + h.vessels_delivered, 0);

  const cur = c.financials_currency ?? null;
  const financials = [
    { label: 'Revenue', value: money(c.revenue, cur) },
    { label: 'Operating income', value: money(c.operating_income, cur) },
    { label: 'Net profit', value: money(c.net_profit, cur) },
    { label: 'Total assets', value: money(c.total_assets, cur) },
    { label: 'Total equity', value: money(c.total_equity, cur) },
    { label: 'Market capitalisation', value: money(c.market_cap, cur) },
  ].filter((f) => f.value);

  const hasIdentifiers = Boolean(c.stock_exchange || c.ticker || c.isin || c.lei);

  // In-page navigation is built from the sections that actually rendered, so it can never
  // offer an anchor that goes nowhere.
  const sections = [
    c.summary ? { id: 'brief', label: 'In brief' } : null,
    founders.length ? { id: 'founders', label: 'Founders' } : null,
    executives.length || board.length ? { id: 'leadership', label: 'Leadership' } : null,
    { id: 'profile', label: 'Profile' },
    financials.length ? { id: 'financials', label: 'Financials' } : null,
    (c.subsidiaries?.length || c.owners?.length || c.parent_name) ? { id: 'structure', label: 'Structure' } : null,
    registry.byType.length ? { id: 'fleet', label: 'Fleet' } : null,
    history.length ? { id: 'record', label: 'Ten-year record' } : null,
    { id: 'ships', label: 'Ships' },
  ].filter(Boolean) as { id: string; label: string }[];

  const fleetHref = (o: number) =>
    `${href(path)}?${new URLSearchParams({ ...(typeFilter ? { type: typeFilter } : {}), offset: String(o) })}#ships`;

  return (
    <>
      <script {...jsonLdProps(organizationJsonLd(c, path))} />
      <script {...jsonLdProps(breadcrumbJsonLd([
        { label: 'Directory', path: '' },
        { label: 'Companies', path: 'companies' },
        { label: c.name, path },
      ]))} />

      {/* ── Masthead ──────────────────────────────────────────────────────────── */}
      <header className="wsd-ink-field text-white">
        <div className="mx-auto max-w-[1340px] px-6 pb-12 pt-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-x-2 text-[13px] text-white/55">
              <li><Link href={href()} className="underline-offset-4 hover:text-white hover:underline">Directory</Link></li>
              <li aria-hidden>/</li>
              <li><Link href={href('companies')} className="underline-offset-4 hover:text-white hover:underline">Companies</Link></li>
              <li aria-hidden>/</li>
              <li className="text-white/85" aria-current="page">{c.name}</li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.55fr_1fr] lg:items-start">
            <div>
              <div className="flex items-start gap-5">
                <div className="bg-white p-1">
                  <Logo src={c.logo_url} name={c.name} credit={c.logo_credit} size="lg" />
                </div>
                <div className="min-w-0">
                  {c.industry ? <Eyebrow className="!text-white/55">{c.industry}</Eyebrow> : null}
                  <h1 className="mt-2 text-[38px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[52px]">
                    {c.name}
                  </h1>
                  {c.legal_name && c.legal_name !== c.name ? (
                    <p className="mt-2 text-[15px] text-white/60">{c.legal_name}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {c.capacity_rank ? (
                  <span className="bg-wsd-violet px-3 py-1.5 text-[13px] font-bold">
                    #{c.capacity_rank} container line by published capacity
                  </span>
                ) : null}
                {c.company_type === 'state' ? (
                  <span className="border border-white/35 px-3 py-1.5 text-[13px] font-semibold text-white/85">
                    State-operated fleet
                  </span>
                ) : null}
                {c.alliance ? (
                  <span className="border border-white/35 px-3 py-1.5 text-[13px] font-semibold text-white/85">
                    {c.alliance}
                  </span>
                ) : null}
                {c.dissolved_year ? (
                  <span className="bg-wsd-vermilion px-3 py-1.5 text-[13px] font-bold">
                    Dissolved {c.dissolved_year}
                  </span>
                ) : null}
              </div>

              <dl className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-3">
                {[
                  { k: 'Headquarters', v: c.headquarters || c.country },
                  { k: 'Founded', v: c.founded_year ? String(c.founded_year) : null },
                  { k: 'Employees', v: num(c.employee_count) },
                ].map((f) => (
                  <div key={f.k}>
                    <dt className="wsd-eyebrow !text-white/50">{f.k}</dt>
                    <dd className="mt-1.5 text-[19px] font-bold" data-figure>
                      {f.v ?? <span className="text-white/30">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>

              {c.website ? (
                <a
                  href={c.website}
                  target="_blank"
                  rel="noreferrer nofollow"
                  className="mt-7 inline-flex items-center gap-2 border border-white px-5 py-2.5 text-[14px] font-semibold transition-colors hover:bg-white hover:text-wsd-ink"
                >
                  Official website <span aria-hidden>↗</span>
                </a>
              ) : null}
            </div>

            {/* A real photograph, or nothing. No stock imagery stands in for one. */}
            {c.image_url ? (
              <Photo
                src={c.image_url}
                alt={`${c.name}`}
                credit={c.image_credit}
                width={900}
                imgClassName="aspect-[4/3] object-cover"
                className="[&_figcaption_p]:!text-white/45"
              />
            ) : null}
          </div>
        </div>
      </header>

      {/* In-page navigation — the reference site's long-page pattern. */}
      <nav
        aria-label="On this page"
        className="wsd-no-print sticky top-[85px] z-30 border-b border-wsd-line-soft bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-[1340px] gap-6 overflow-x-auto px-6 py-3">
          {sections.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="whitespace-nowrap border-b-2 border-transparent pb-1 text-[13.5px] font-semibold text-wsd-muted transition-colors hover:border-wsd-violet hover:text-wsd-ink"
            >
              {sec.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-[1340px] px-6">
        {/* ── The two fleet measurements, never merged ────────────────────────── */}
        <section className="-mt-px grid gap-px bg-wsd-line-soft sm:grid-cols-2 lg:grid-cols-4">
          <Figure
            label="Ships in this registry"
            value={num(c.registry_vessel_count) ?? '0'}
            basis="Counted from individual vessel records"
            source={c.wikidata_qid ? 'Wikidata' : c.data_source}
            sourceUrl={c.source_url}
          />
          <Figure
            label="Reported fleet size"
            value={num(c.reported_fleet_size)}
            basis={reported ? 'Published by the industry' : 'No published figure available'}
            source={reported?.source}
            sourceUrl={reported?.sourceUrl}
            asOf={reported?.asOf}
            tone={reported ? 'violet' : 'plain'}
          />
          <Figure
            label="Container capacity"
            value={c.reported_teu ? `${num(c.reported_teu)} TEU` : null}
            basis={c.reported_teu ? 'Published capacity' : 'Not a ranked container line'}
            source={reported?.source}
            sourceUrl={reported?.sourceUrl}
            asOf={reported?.asOf}
          />
          <Figure
            label="Gross tonnage on record"
            value={num(c.registry_gt)}
            basis={`Summed over ${num(s?.with_tonnage ?? 0) ?? '0'} ships reporting tonnage`}
          />
        </section>

        {reported && c.registry_vessel_count > 0 && reported.fleetSize > c.registry_vessel_count * 2 ? (
          <p className="mt-6 border-l-[3px] border-wsd-yellow bg-wsd-ground-alt px-5 py-4 text-[14.5px] leading-relaxed text-wsd-body">
            This company reports <strong className="font-bold">{num(reported.fleetSize)}</strong> ships while
            this registry holds individual records for <strong className="font-bold">{num(c.registry_vessel_count)}</strong>.
            That gap is coverage, not a contradiction: open reference data documents a minority of the
            world fleet ship by ship. The list below is what can be named and verified.
          </p>
        ) : null}

        {/* ── In brief ────────────────────────────────────────────────────────── */}
        {c.summary ? (
          <section id="brief" className="mt-20 scroll-mt-32">
            <SectionHead
              eyebrow="In brief"
              title={`What ${c.name} is`}
              aside={c.wikipedia_url ? (
                <a href={c.wikipedia_url} target="_blank" rel="noreferrer" className="wsd-link">Full article ↗</a>
              ) : null}
            />
            <div className="max-w-3xl">
              <QuotedSummary summary={c.summary} url={c.wikipedia_url} title={c.wikipedia_title} />
            </div>
          </section>
        ) : null}

        {/* ── Founders — who created the company ──────────────────────────────── */}
        {founders.length ? (
          <section id="founders" className="mt-20 scroll-mt-32">
            <SectionHead
              eyebrow="Origin"
              title={founders.length === 1 ? 'Who founded it' : 'Who founded it'}
              note={
                <>
                  {c.founded_year ? `${c.name} was founded in ${c.founded_year}` : `${c.name} was founded`}
                  {c.formed_in ? ` in ${c.formed_in}` : ''}
                  {founders.length === 1 ? ' by one named founder on record.' : ` by ${founders.length} named founders on record.`}
                  {' '}Portraits are shown only where a freely licensed photograph exists and its
                  photographer is known.
                </>
              }
            />
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {founders.map((p) => (
                <PersonCard key={p.qid ?? p.name} person={p} emphasis />
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Leadership ──────────────────────────────────────────────────────── */}
        {executives.length || board.length ? (
          <section id="leadership" className="mt-20 scroll-mt-32">
            <SectionHead
              eyebrow="People"
              title="Leadership on record"
              note="Officers and directors as recorded in open reference data. This reflects the most recent statement in the source, not a filing date — check the company's own disclosures before relying on it."
            />
            {executives.length ? (
              <div className="mb-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {executives.map((p) => <PersonCard key={p.qid ?? p.name} person={p} emphasis />)}
              </div>
            ) : null}
            {board.length ? (
              <>
                <Eyebrow className="mb-4">Board</Eyebrow>
                <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                  {board.map((p) => <PersonCard key={p.qid ?? p.name} person={p} />)}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {/* ── Corporate profile + registry summary ────────────────────────────── */}
        <section id="profile" className="mt-20 scroll-mt-32">
          <SectionHead eyebrow="Corporate profile" title="Identity and registration" />
          <div className="grid gap-10 lg:grid-cols-2">
            <dl>
              <Field label="Legal name">{c.legal_name}</Field>
              <Field label="Industry">{c.industry}</Field>
              <Field label="Legal form">{c.legal_form}</Field>
              <Field label="Country of registration">
                {c.country_code ? (
                  <Link href={href(`countries/${c.country_code.toLowerCase()}`)} className="wsd-link">{c.country}</Link>
                ) : c.country}
              </Field>
              <Field label="Headquarters">{c.headquarters}</Field>
              <Field label="Formed in">{c.formed_in}</Field>
              <Field label="Founded">{c.founded_year}</Field>
              <Field label="Dissolved">{c.dissolved_year}</Field>
              <Field label="Employees">{num(c.employee_count)}</Field>
              {hasIdentifiers ? (
                <>
                  <Field label="Listed on">{c.stock_exchange}</Field>
                  <Field label="Ticker">{c.ticker}</Field>
                  <Field label="ISIN"><span className="font-mono text-[13.5px]">{c.isin}</span></Field>
                  <Field label="Legal Entity Identifier"><span className="font-mono text-[13.5px]">{c.lei}</span></Field>
                </>
              ) : null}
              <Field label="Head office coordinates">
                {c.hq_lat != null && c.hq_lon != null
                  ? `${Number(c.hq_lat).toFixed(4)}, ${Number(c.hq_lon).toFixed(4)}`
                  : null}
              </Field>
            </dl>

            <dl>
              <Field label="Ships on record here">{num(c.registry_vessel_count) ?? '0'}</Field>
              <Field label="Vessel types operated">{s?.vessel_types ? num(s.vessel_types) : null}</Field>
              <Field label="Flag states used">{s?.flag_states ? num(s.flag_states) : null}</Field>
              <Field label="Average vessel age">{s?.avg_age_years ? `${dec(s.avg_age_years)} years` : null}</Field>
              <Field label="Oldest vessel on record">{s?.oldest_year}</Field>
              <Field label="Newest vessel on record">{s?.newest_year}</Field>
              <Field label="Largest vessel by tonnage">{num(s?.max_gt)}</Field>
              <Field label="Average tonnage">{num(s?.avg_gt)}</Field>
              <Field label="Market share">{pct(c.market_share_pct)}</Field>
              <Field label="Parent company">{c.parent_name}</Field>
              <Field label="Alliance">{c.alliance}</Field>
              <Field label="Record source">
                {c.source_url ? (
                  <a href={c.source_url} target="_blank" rel="noreferrer" className="wsd-link">{c.data_source}</a>
                ) : c.data_source}
              </Field>
              <Field label="Last refreshed">
                {c.last_ingested_at ? String(c.last_ingested_at).slice(0, 10) : null}
              </Field>
            </dl>
          </div>
        </section>

        {/* ── Financials ──────────────────────────────────────────────────────── */}
        {financials.length ? (
          <section id="financials" className="mt-20 scroll-mt-32">
            <SectionHead
              eyebrow="Reported financials"
              title={`Financial year ${c.financials_as_of}`}
              aside={`All figures in ${cur}`}
              note="Published company figures for a single reported year, shown together so they are comparable. Figures from other years are not mixed in — a page that pairs one year's revenue with another's assets misreports both."
            />
            <div className="grid gap-px bg-wsd-line-soft sm:grid-cols-2 lg:grid-cols-3">
              {financials.map((f) => (
                <div key={f.label} className="bg-white p-5">
                  <p className="wsd-eyebrow">{f.label}</p>
                  <p data-figure className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.03em] text-wsd-ink">
                    {f.value}
                  </p>
                  <p className="mt-2 text-[12.5px] text-wsd-muted">Reported for {c.financials_as_of}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Ownership and structure ─────────────────────────────────────────── */}
        {c.parent_name || c.owners?.length || c.subsidiaries?.length || c.products?.length ? (
          <section id="structure" className="mt-20 scroll-mt-32">
            <SectionHead eyebrow="Corporate structure" title="Ownership and holdings" />
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-8">
                {c.parent_name ? (
                  <div>
                    <Eyebrow className="mb-3">Parent company</Eyebrow>
                    <p className="text-[19px] font-bold text-wsd-ink">{c.parent_name}</p>
                  </div>
                ) : null}
                {c.owners?.length ? (
                  <div>
                    <Eyebrow className="mb-3">Owned by</Eyebrow>
                    <OrgChips orgs={c.owners} related={related} />
                  </div>
                ) : null}
                {c.products?.length ? (
                  <div>
                    <Eyebrow className="mb-3">Services and products</Eyebrow>
                    <OrgChips orgs={c.products} related={related} />
                  </div>
                ) : null}
              </div>
              {c.subsidiaries?.length ? (
                <div>
                  <Eyebrow className="mb-3">
                    Subsidiaries and units ({c.subsidiaries.length})
                  </Eyebrow>
                  <OrgChips orgs={c.subsidiaries} related={related} max={40} />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── Fleet composition ───────────────────────────────────────────────── */}
        {registry.byType.length ? (
          <section id="fleet" className="mt-20 scroll-mt-32">
            <SectionHead
              eyebrow="Fleet on record"
              title="What this company sails"
              note={`Composition of the ${num(c.registry_vessel_count)} vessels this registry attributes to ${c.name}. Bars are true proportions of that set, not of the company's full fleet.`}
            />
            <div className="grid gap-10 lg:grid-cols-3">
              <div>
                <Eyebrow className="mb-3">By vessel type</Eyebrow>
                {registry.byType.map((r) => (
                  <BarRow
                    key={r.vessel_type}
                    label={typeLabel(r.vessel_type)}
                    value={r.n}
                    max={maxType}
                    accent
                    href={`${href(path)}?type=${encodeURIComponent(r.vessel_type)}#ships`}
                  />
                ))}
              </div>
              {registry.byFlag.length ? (
                <div>
                  <Eyebrow className="mb-3">By flag state</Eyebrow>
                  {registry.byFlag.slice(0, 10).map((r) => (
                    <BarRow
                      key={r.flag_country}
                      label={r.flag_country}
                      value={r.n}
                      max={maxFlag}
                      href={`${href('ships')}?flag=${encodeURIComponent(r.flag_country)}`}
                    />
                  ))}
                </div>
              ) : null}
              {registry.builders.length ? (
                <div>
                  <Eyebrow className="mb-3">By shipbuilder</Eyebrow>
                  {registry.builders.slice(0, 10).map((r) => (
                    <BarRow key={r.builder_name} label={r.builder_name} value={r.n} max={maxBuilder} />
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── Ten-year record ─────────────────────────────────────────────────── */}
        {history.length ? (
          <section id="record" className="mt-20 scroll-mt-32">
            <SectionHead
              eyebrow="Delivery history"
              title={`${history.length}-year fleet record`}
              note={
                <>
                  Ships delivered in each of the last {history.length} years, counted from the recorded
                  build year of vessels attributed to this company, with the running total of its fleet
                  on record.{' '}
                  {deliveredInWindow === 0
                    ? 'No deliveries fall inside this window — this company’s vessels on record were all built earlier.'
                    : `${num(deliveredInWindow)} deliveries fall inside this window.`}
                </>
              }
            />
            <TableShell minWidth={620}>
              <thead>
                <tr className="border-b border-wsd-ink">
                  <Th>Year</Th>
                  <Th>Deliveries</Th>
                  <Th align="right">Ships delivered</Th>
                  <Th align="right">Gross tonnage added</Th>
                  <Th align="right">Fleet on record</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.year} className="border-b border-wsd-line-soft last:border-0 hover:bg-wsd-ground-alt">
                    <td className="px-4 py-2.5 font-bold">{h.year}</td>
                    <td className="px-4 py-2.5">
                      <div className="wsd-bar-track">
                        <div
                          className="wsd-bar-fill"
                          data-accent="violet"
                          style={{ width: maxDelivered > 0 ? `${(h.vessels_delivered / maxDelivered) * 100}%` : '0%' }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">{h.vessels_delivered}</td>
                    <td className="px-4 py-2.5 text-right text-wsd-body">{num(h.gt_delivered) ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right text-wsd-body">{num(h.cumulative_vessels)}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </section>
        ) : null}

        {/* ── The ships ───────────────────────────────────────────────────────── */}
        <section id="ships" className="mt-20 scroll-mt-32">
          <SectionHead
            eyebrow="Vessel records"
            title={typeFilter ? `Ships on record · ${typeLabel(typeFilter)}` : 'Ships on record'}
            aside={typeFilter ? (
              <Link href={`${href(path)}#ships`} className="wsd-link">Show all types</Link>
            ) : (fleet ? `${num(fleet.total)} vessels` : null)}
          />

          {!fleet || fleet.data.length === 0 ? (
            <EmptyState
              title="No individual ships attributed to this company yet"
              detail="The company is on record, but no vessel in the registry currently names it as operator or owner. Nothing is invented to fill this space."
              action={<Link href={href('ships')} className="wsd-link">Search the whole registry instead</Link>}
            />
          ) : (
            <>
              <TableShell minWidth={1040}>
                <thead>
                  <tr className="border-b border-wsd-ink">
                    <Th>Ship</Th>
                    <Th>IMO</Th>
                    <Th>Type</Th>
                    <Th>Flag</Th>
                    <Th align="right">Built</Th>
                    <Th align="right">Gross tonnage</Th>
                    <Th align="right">Deadweight</Th>
                    <Th align="right">Length</Th>
                    <Th>Builder</Th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.data.map((v: Vessel) => (
                    <tr key={v.slug} className="border-b border-wsd-line-soft last:border-0 hover:bg-wsd-ground-alt">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {v.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={commonsImage(v.image_url, 120) ?? ''}
                              alt=""
                              loading="lazy"
                              className="h-9 w-14 shrink-0 border border-wsd-line-soft object-cover"
                            />
                          ) : (
                            <span aria-hidden className="h-9 w-14 shrink-0 border border-wsd-line-soft bg-wsd-ground-mid" />
                          )}
                          <Link href={href(`ships/${v.slug}`)} className="font-bold text-wsd-ink hover:text-wsd-violet">
                            {v.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-wsd-body">{v.imo_number ?? '—'}</td>
                      <td className="px-4 py-2.5"><TypeChip type={v.vessel_type} /></td>
                      <td className="px-4 py-2.5 text-wsd-body">{v.flag_country ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right">{v.year_built ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{num(v.gross_tonnage) ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right text-wsd-body">{num(v.deadweight_tons) ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right text-wsd-body">{v.length_m ? `${dec(v.length_m)} m` : '—'}</td>
                      <td className="px-4 py-2.5 text-wsd-body">{v.builder_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
              <Pagination offset={offset} pageSize={FLEET_PAGE} total={fleet.total} hrefFor={fleetHref} />
            </>
          )}
          <FleetNumbersNote className="mt-6 max-w-3xl" />
        </section>

        {context ? <CompanyComparison company={c} context={context} /> : null}

        {/* ── Peers ───────────────────────────────────────────────────────────── */}
        {peers.length ? (
          <section className="mt-20">
            <SectionHead
              eyebrow="Same country"
              title={`Other operators registered in ${c.country}`}
              aside={c.country_code ? (
                <Link href={href(`countries/${c.country_code.toLowerCase()}`)} className="wsd-link">
                  All {c.country} operators
                </Link>
              ) : null}
            />
            <div className="grid gap-px bg-wsd-line-soft sm:grid-cols-2 lg:grid-cols-4">
              {peers.map((p) => (
                <Link key={p.slug} href={href(`companies/${p.slug}`)} className="group bg-white p-5 transition-colors hover:bg-wsd-ground-alt">
                  <div className="flex items-start gap-3">
                    <Logo src={p.logo_url} name={p.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight text-wsd-ink group-hover:text-wsd-violet">
                        {p.name}
                      </p>
                      <p className="mt-1.5 text-[12.5px] text-wsd-muted" data-figure>
                        {p.capacity_rank ? `#${p.capacity_rank} by capacity · ` : ''}
                        {num(p.registry_vessel_count) ?? '0'} on record
                        {p.founded_year ? ` · est. ${p.founded_year}` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── Sources ─────────────────────────────────────────────────────────── */}
        <section className="mt-20">
          <SectionHead eyebrow="Provenance" title="Where this page comes from" />
          <div className="grid gap-6 text-[14px] leading-relaxed text-wsd-body sm:grid-cols-3">
            <p>
              <strong className="block font-bold text-wsd-ink">Company and vessel records</strong>
              {c.source_url ? (
                <a href={c.source_url} target="_blank" rel="noreferrer" className="wsd-link">Wikidata item {c.wikidata_qid}</a>
              ) : c.data_source}
              , released under CC0. Counted figures on this page are counts over those records.
            </p>
            <p>
              <strong className="block font-bold text-wsd-ink">Written summary</strong>
              {c.wikipedia_url ? (
                <>
                  Quoted from{' '}
                  <a href={c.wikipedia_url} target="_blank" rel="noreferrer" className="wsd-link">{c.wikipedia_title}</a>
                  {' '}on English Wikipedia, reused under CC BY-SA 4.0.
                </>
              ) : 'No English Wikipedia article is linked to this company, so no summary is shown.'}
            </p>
            <p>
              <strong className="block font-bold text-wsd-ink">Published fleet figures</strong>
              {reported?.source ? (
                <>
                  {reported.sourceUrl ? (
                    <a href={reported.sourceUrl} target="_blank" rel="noreferrer" className="wsd-link">{reported.source}</a>
                  ) : reported.source}
                  {reported.asOf ? `, as of ${String(reported.asOf).slice(0, 10)}` : ''}. These are the
                  industry&rsquo;s numbers, not this directory&rsquo;s.
                </>
              ) : 'No published fleet figure is available for this company.'}
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
