import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, MapPin, ShieldCheck, FileSignature, Lock, Landmark } from 'lucide-react';
import { getOpportunity } from '@/lib/marketplace';
import ExpressInterestButton from '@/components/invest/ExpressInterestButton';

export const dynamic = 'force-dynamic';

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
const pct = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && v ? `${n}%` : '—'; };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const o = await getOpportunity(id);
  if (!o) return { title: 'Opportunity not found | Baalvion Invest' };
  const name = o.company?.brand_name || o.company?.legal_name || 'Opportunity';
  return {
    title: `${name} — ${label(o.round)} | Baalvion Invest`,
    description: `${name} is raising ${money(o.amount_sought)} at a ${money(o.pre_money_valuation)} pre-money valuation. Explore this private investment opportunity on Baalvion Invest.`,
    alternates: { canonical: `/invest/${id}` },
  };
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getOpportunity(id);
  if (!o) return notFound();
  const name = o.company?.brand_name || o.company?.legal_name || 'Confidential';

  const terms = [
    { label: 'Round', value: label(o.round) },
    { label: 'Raising', value: money(o.amount_sought) },
    { label: 'Pre-money valuation', value: money(o.pre_money_valuation) },
    { label: 'Equity offered', value: pct(o.equity_offered_pct) },
    { label: 'Minimum ticket', value: money(o.min_ticket) },
    { label: 'Industry', value: label(o.company?.industry_code) },
  ];

  const steps = [
    { icon: ShieldCheck, title: 'Express interest & verify', desc: 'Sign in as a verified investor and request access to this round.' },
    { icon: Lock, title: 'Sign NDA → unlock data room', desc: 'A signed NDA unlocks the company’s secure data room.' },
    { icon: Building2, title: 'Due diligence', desc: 'Request and review financial, legal and operational documents in-platform.' },
    { icon: FileSignature, title: 'Term sheet & e-sign', desc: 'Negotiate terms, then sign the SPA digitally.' },
    { icon: Landmark, title: 'Fund via escrow', desc: 'Funds move through escrow and release on agreed conditions; the cap table updates automatically.' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f]">
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-[1100px] items-center gap-1.5 px-6 py-3 text-[12px] text-[#6e6e73]">
          <Link href="/invest" className="text-primary hover:underline">Invest</Link>
          <span>›</span><span className="truncate">{name}</span>
        </div>
      </nav>

      <section className="border-b border-gray-100 bg-gradient-to-b from-[#fafafa] to-white">
        <div className="mx-auto max-w-[1100px] px-6 py-12 md:py-16">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-gray-100 text-xl font-bold text-primary">{initials(name)}</div>
            <div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">{label(o.round)}</span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-black md:text-4xl">{name}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[#6e6e73]">
                <Building2 className="h-4 w-4" />{label(o.company?.industry_code)}
                <span className="mx-1">·</span><MapPin className="h-4 w-4" />{o.company?.country || '—'}
                <span className="mx-1">·</span>{label(o.company?.stage)}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-lg text-[#333]">{o.title}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Key terms</h2>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-3">
            {terms.map((t) => (
              <div key={t.label} className="bg-white p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t.label}</p>
                <p className="mt-1 text-xl font-bold text-black">{t.value}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-12 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">How investing works</h2>
          <ol className="mt-5 space-y-5">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-primary">
                  <s.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-black"><span className="mr-1 text-primary">{i + 1}.</span>{s.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-gray-200 p-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Raising</p>
            <p className="text-3xl font-bold text-black">{money(o.amount_sought)}</p>
            <p className="mt-1 text-sm text-gray-500">at {money(o.pre_money_valuation)} pre-money · min {money(o.min_ticket)}</p>
            <div className="mt-6 flex flex-col gap-2">
              <ExpressInterestButton opportunityId={o.id} companyOrg={o.org_id} />
              <Link href="/resources/contact-ir" className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-semibold transition-colors hover:bg-gray-50">
                Contact the team
              </Link>
              <Link href="/invest" className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-black">
                <ArrowLeft className="h-4 w-4" /> All opportunities
              </Link>
            </div>
            <p className="mt-5 text-[11px] leading-relaxed text-gray-400">
              Private placement for qualified / accredited investors. High risk, illiquid; capital at risk.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
