import { Metadata } from 'next';
import { GitCompareArrows } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { listCountries } from '@/server/gckb/public-read';
import { CompareTool } from './_components/compare-tool';

/**
 * @file (public)/compare/page.tsx
 * @description Country Comparison — side-by-side trade posture for 2–4 countries.
 */

const TITLE = 'Compare Countries — Trade Policy Side by Side';
const DESCRIPTION =
  'Compare the trade posture of any countries side by side: policy counts by category, headline taxes, tariffs, trade agreements, authorities and ports.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/compare',
  keywords: ['compare countries trade', 'country trade comparison', 'tariff comparison', 'tax comparison', 'trade policy'],
});

export const revalidate = 300;

export default async function ComparePage() {
  const countries = await listCountries();

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Compare', path: '/compare' }]))} />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
            <GitCompareArrows className="size-4" /> Compare
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Two markets, one view.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          {countries.length < 2 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-24 text-center">
              <p className="text-sm font-bold text-slate-300">At least two published countries are needed to compare.</p>
              <p className="mt-1 text-xs text-slate-500">Reference data is loaded through the import API or the seed tooling.</p>
            </div>
          ) : (
            <CompareTool countries={countries} />
          )}
        </div>
      </section>
    </>
  );
}
