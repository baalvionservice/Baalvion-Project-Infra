import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Building2, MapPin } from 'lucide-react';
import { getOpportunities, deriveFacets, type Opportunity } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Invest — Discover Opportunities | Baalvion Invest',
  description: 'Discover vetted private investment opportunities across industries and stages. For qualified and accredited investors on the Baalvion Invest marketplace.',
  alternates: { canonical: '/invest' },
};

const COMPANY = 'Baalvion Industries Private Limited';
const money = (v: unknown) => {
  const n = Number(v);
  if (!v || !Number.isFinite(n)) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${n}`;
};
const label = (s?: string | null) => (s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');
const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function Chip({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
      }`}
    >
      {children}
    </Link>
  );
}

export default async function InvestDiscoverPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const filters = { industry: sp.industry, stage: sp.stage, round: sp.round, country: sp.country };
  const all = await getOpportunities();
  const facets = deriveFacets(all);
  const opps = all.filter((o) =>
    (!filters.industry || o.company?.industry_code === filters.industry) &&
    (!filters.stage || o.company?.stage === filters.stage) &&
    (!filters.round || o.round === filters.round) &&
    (!filters.country || o.company?.country === filters.country));

  const buildHref = (key: string, val: string) => {
    const next = { ...filters, [key]: filters[key as keyof typeof filters] === val ? '' : val } as Record<string, string>;
    const q = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return `/invest${q ? `?${q}` : ''}`;
  };

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#0a0a0a] to-[#161616] text-white">
        <div className="mx-auto max-w-[1180px] px-6 py-16 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Baalvion Invest</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
            Discover vetted private investment opportunities.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            Curated rounds across industries and stages — diligence, negotiation, signing and funding all happen securely inside the platform. For qualified and accredited investors.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/onboarding" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90">
              Apply for investor access
            </Link>
            <a href="#opportunities" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5">
              Browse {all.length} live {all.length === 1 ? 'round' : 'rounds'}
            </a>
            <Link href="/invest/deals" className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5">
              My deal pipeline
            </Link>
          </div>
        </div>
      </section>

      <section id="opportunities" className="mx-auto max-w-[1180px] px-6 py-12">
        {/* Filters */}
        <div className="space-y-3">
          {facets.industries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Industry</span>
              {facets.industries.map((i) => <Chip key={i} active={filters.industry === i} href={buildHref('industry', i)}>{label(i)}</Chip>)}
            </div>
          )}
          {facets.stages.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Stage</span>
              {facets.stages.map((s) => <Chip key={s} active={filters.stage === s} href={buildHref('stage', s)}>{label(s)}</Chip>)}
            </div>
          )}
          {facets.rounds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Round</span>
              {facets.rounds.map((r) => <Chip key={r} active={filters.round === r} href={buildHref('round', r)}>{label(r)}</Chip>)}
            </div>
          )}
        </div>

        {/* Results */}
        <p className="mb-6 mt-8 text-sm text-gray-500">{opps.length} {opps.length === 1 ? 'opportunity' : 'opportunities'}</p>
        {opps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <p className="text-lg font-semibold">No opportunities match your filters.</p>
            <Link href="/invest" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">Clear filters</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {opps.map((o) => <OpportunityCard key={o.id} o={o} />)}
          </div>
        )}
      </section>

      {/* Footer note */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-[1180px] px-6 py-10 text-center text-xs text-gray-500">
          Investments are private placements intended for qualified / accredited investors and involve a high degree of risk, including illiquidity and possible loss of capital. {COMPANY}.
        </div>
      </section>
    </div>
  );
}

function OpportunityCard({ o }: { o: Opportunity }) {
  const name = o.company?.brand_name || o.company?.legal_name || 'Confidential';
  return (
    <Link
      href={`/invest/${o.id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-gray-100 text-sm font-bold text-primary">
          {initials(name)}
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">{label(o.round)}</span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug text-black">{name}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
        <Building2 className="h-3.5 w-3.5" />{label(o.company?.industry_code)}
        <span className="mx-1">·</span><MapPin className="h-3.5 w-3.5" />{o.company?.country || '—'}
      </p>
      <p className="mt-3 line-clamp-2 text-sm text-gray-600">{o.title}</p>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
        <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Raising</p><p className="text-sm font-bold text-black">{money(o.amount_sought)}</p></div>
        <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Valuation</p><p className="text-sm font-bold text-black">{money(o.pre_money_valuation)}</p></div>
        <div><p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Min ticket</p><p className="text-sm font-bold text-black">{money(o.min_ticket)}</p></div>
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
        View opportunity <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}
