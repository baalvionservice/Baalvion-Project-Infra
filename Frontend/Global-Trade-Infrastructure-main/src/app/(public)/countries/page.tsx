import { Metadata } from 'next';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { listCountries } from '@/server/gckb/public-read';
import { CountryExplorer } from './_components/country-explorer';

/**
 * @file (public)/countries/page.tsx
 * @description Public Country Explorer — the entry point into the Global Country
 * Knowledge Base. Server-rendered (SSR + ISR) for SEO; client-side search/filter.
 */

const TITLE = 'Country Explorer — Global Trade Knowledge Base';
const DESCRIPTION =
  'Explore import/export policy, taxes, tariffs, duties, licenses, certificates, restricted goods, customs authorities, ports and trade agreements for every jurisdiction on Baalvion.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/countries',
  keywords: ['country trade policy', 'import export rules', 'customs tariffs', 'trade agreements', 'HS codes', 'country knowledge base'],
});

export const revalidate = 300;

export default async function CountriesPage() {
  const countries = await listCountries();

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Countries', path: '/countries' }]))} />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Global Country Knowledge Base</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Trade rules for every country, <span className="text-primary">in one place.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          {countries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-24 text-center">
              <p className="text-sm font-bold text-slate-300">The knowledge base has no published countries yet.</p>
              <p className="mt-1 text-xs text-slate-500">Reference data is loaded through the import API or the seed tooling.</p>
            </div>
          ) : (
            <CountryExplorer countries={countries} />
          )}
        </div>
      </section>
    </>
  );
}
