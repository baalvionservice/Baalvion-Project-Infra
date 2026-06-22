import { Metadata } from 'next';
import { Anchor } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { listPortsDirectory } from '@/server/gckb/public-read';
import { PortDirectory } from './_components/port-directory';

/**
 * @file (public)/ports/page.tsx
 * @description Global ports & points-of-entry directory.
 */

const TITLE = 'Global Ports & Points of Entry Directory';
const DESCRIPTION = 'Search seaports, airports, dry ports, ICDs, rail terminals and land border crossings worldwide — with UN/LOCODE, IATA and ICAO codes.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/ports',
  keywords: ['ports directory', 'UN/LOCODE', 'seaport airport', 'points of entry', 'customs ports', 'dry port ICD'],
});

export const revalidate = 300;

export default async function PortsPage() {
  const ports = await listPortsDirectory();

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Ports', path: '/ports' }]))} />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary"><Anchor className="size-4" /> Ports</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">Every gateway, mapped.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          {ports.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-24 text-center">
              <p className="text-sm font-bold text-slate-300">No ports are published yet.</p>
              <p className="mt-1 text-xs text-slate-500">Reference data is loaded through the import API or the seed tooling.</p>
            </div>
          ) : (
            <PortDirectory ports={ports} />
          )}
        </div>
      </section>
    </>
  );
}
