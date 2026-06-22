import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { getCountryProfile, getCountryDetail } from '@/server/gckb/public-read';
import type { PolicyGroup } from '@/server/gckb/policy-forms';
import {
  PolicyGroupSection, AuthoritiesSection, PortsSection, AgreementsSection, KeyFacts,
  GROUP_ORDER, groupLabel,
} from './_components/profile-sections';

/**
 * @file (public)/countries/[code]/page.tsx
 * @description Public country profile — aggregates every published policy
 * (grouped), authorities, ports and trade agreements for one jurisdiction.
 * Server-rendered (SSR + ISR) with dynamic, per-country SEO metadata.
 */

export const revalidate = 300;

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const country = await getCountryDetail(code);
  if (!country) {
    return pageMetadata({ title: 'Country not found', description: 'This country is not published in the knowledge base.', path: `/countries/${code}`, noindex: true });
  }
  return pageMetadata({
    title: `${country.name} — Trade Policy, Tariffs, Customs & FTAs`,
    description: `Import/export policy, taxes, tariffs, duties, licenses, certificates, restricted goods, customs authorities, ports and trade agreements for ${country.name}.`,
    path: `/countries/${country.code.toLowerCase()}`,
    keywords: [`${country.name} import rules`, `${country.name} tariffs`, `${country.name} customs`, `${country.name} trade agreements`, 'HS codes', 'duty calculator'],
  });
}

export default async function CountryProfilePage({ params }: Params) {
  const { code } = await params;
  const profile = await getCountryProfile(code);
  if (!profile) notFound();

  const { country, policyGroups, authorities, ports, agreements, counts } = profile;

  const presentGroups = GROUP_ORDER.filter((g) => (policyGroups[g]?.length ?? 0) > 0);
  const nav: Array<{ id: string; label: string }> = [
    ...presentGroups.map((g) => ({ id: g, label: groupLabel(g) })),
    ...(authorities.length ? [{ id: 'authorities', label: 'Authorities' }] : []),
    ...(ports.length ? [{ id: 'ports', label: 'Ports' }] : []),
    ...(agreements.length ? [{ id: 'agreements', label: 'Agreements' }] : []),
  ];

  return (
    <>
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Countries', path: '/countries' },
            { name: country.name, path: `/countries/${country.code.toLowerCase()}` },
          ]),
        )}
      />

      {/* Header */}
      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <Link href="/countries" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 transition hover:text-primary">
            <ArrowLeft className="size-3.5" /> All countries
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <span className="text-6xl leading-none" aria-hidden>{country.flagEmoji ?? '🏳️'}</span>
            <div>
              <h1 className="text-4xl font-black text-white sm:text-5xl">{country.name}</h1>
              {country.officialName && country.officialName !== country.name ? (
                <p className="mt-1 text-sm text-slate-400">{country.officialName}</p>
              ) : null}
            </div>
            <span className="ml-auto rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm font-black tracking-widest text-slate-200">{country.code}</span>
          </div>

          <div className="mt-10">
            <KeyFacts country={country} />
          </div>

          <div className="mt-10 flex flex-wrap gap-3 text-center">
            {[
              { label: 'Policies', value: counts.policies },
              { label: 'Authorities', value: counts.authorities },
              { label: 'Ports', value: counts.ports },
              { label: 'Agreements', value: counts.agreements },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/50 px-6 py-4">
                <p className="text-2xl font-black tabular-nums text-white">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* In-page nav */}
      {nav.length > 0 ? (
        <nav aria-label="Profile sections" className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3">
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="whitespace-nowrap rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-[11px] font-bold text-slate-400 transition hover:border-primary/50 hover:text-primary">
                {n.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      {/* Body */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-14 px-6 py-14">
          {nav.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-20 text-center">
              <p className="text-sm font-bold text-slate-300">No published trade policy is on file for {country.name} yet.</p>
              <p className="mt-1 text-xs text-slate-500">Reference data is loaded through the import API or the seed tooling.</p>
            </div>
          ) : (
            <>
              {presentGroups.map((g) => (
                <PolicyGroupSection key={g} group={g as PolicyGroup} policies={policyGroups[g]!} />
              ))}
              <AuthoritiesSection authorities={authorities} />
              <PortsSection ports={ports} />
              <AgreementsSection agreements={agreements} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
