import { Metadata } from 'next';
import { Handshake } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { listAgreements } from '@/server/gckb/public-read';
import { FtaExplorer } from './_components/fta-explorer';

/**
 * @file (public)/fta/page.tsx
 * @description FTA Explorer — every published free-trade agreement, customs union
 * and preferential arrangement, with members and rules of origin.
 */

const TITLE = 'Free Trade Agreements & Rules of Origin';
const DESCRIPTION =
  'Explore free-trade agreements, customs unions and preferential arrangements — members, rules of origin, duty preferences and the tariff lines they affect.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/fta',
  keywords: ['free trade agreement', 'FTA', 'rules of origin', 'duty preference', 'customs union', 'preferential tariff', 'CEPA RCEP USMCA'],
});

export const revalidate = 300;

export default async function FtaPage() {
  const agreements = await listAgreements();

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Trade Agreements', path: '/fta' }]))} />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
            <Handshake className="size-4" /> Trade Agreements
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Where do your goods get preferential treatment?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          {agreements.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-24 text-center">
              <p className="text-sm font-bold text-slate-300">No trade agreements are published yet.</p>
              <p className="mt-1 text-xs text-slate-500">Reference data is loaded through the import API or the seed tooling.</p>
            </div>
          ) : (
            <FtaExplorer agreements={agreements} />
          )}
        </div>
      </section>
    </>
  );
}
