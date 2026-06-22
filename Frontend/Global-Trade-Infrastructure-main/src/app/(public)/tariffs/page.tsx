import { Metadata } from 'next';
import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { listCountries } from '@/server/gckb/public-read';
import { DutyCalculatorForm } from './_components/duty-calculator-form';

/**
 * @file (public)/tariffs/page.tsx
 * @description Tariff Explorer + Import Duty Calculator. Computes landed cost
 * (basic customs duty, additional duties, import taxes) from the published
 * knowledge base, applying FTA preference when the origin qualifies.
 */

const TITLE = 'Tariff Explorer & Import Duty Calculator';
const DESCRIPTION =
  'Estimate import duties, additional duties and taxes (VAT/GST) for any HS code and destination, with free-trade-agreement preference applied automatically by country of origin.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/tariffs',
  keywords: ['import duty calculator', 'tariff calculator', 'HS code duty', 'landed cost', 'FTA preference', 'customs duty', 'VAT GST import'],
});

export const revalidate = 300;

export default async function TariffsPage() {
  const countries = await listCountries();

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Tariffs', path: '/tariffs' }]))} />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
            <Calculator className="size-4" /> Tariffs & Duties
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            What will it cost to land your goods?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          {countries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-24 text-center">
              <p className="text-sm font-bold text-slate-300">No tariff data is published yet.</p>
              <p className="mt-1 text-xs text-slate-500">Reference data is loaded through the import API or the seed tooling.</p>
            </div>
          ) : (
            <DutyCalculatorForm countries={countries} />
          )}
        </div>
      </section>

      {countries.length > 0 ? (
        <section className="border-t border-white/5 bg-slate-950">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <h2 className="text-lg font-black text-white">Browse tariff schedules by country</h2>
            <p className="mt-1 text-sm text-slate-400">Open a country to see its tariffs, duties and taxes in context.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {countries.map((c) => (
                <Link
                  key={c.code}
                  href={`/countries/${c.code.toLowerCase()}#tariff`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-primary/50 hover:text-primary"
                >
                  <span aria-hidden>{c.flagEmoji ?? '🏳️'}</span> {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
