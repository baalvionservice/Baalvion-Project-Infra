import { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { listAuthoritiesDirectory } from '@/server/gckb/public-read';
import { AuthorityDirectory } from './_components/authority-directory';

/**
 * @file (public)/authorities/page.tsx
 * @description Global government & customs authority directory.
 */

const TITLE = 'Government & Customs Authorities Directory';
const DESCRIPTION = 'Find the customs, tax, health, standards, central-bank and trade-ministry authorities that govern trade in each country — with contact details and jurisdiction.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/authorities',
  keywords: ['customs authority', 'trade ministry', 'tax authority', 'government directory', 'regulatory bodies', 'central bank'],
});

export const revalidate = 300;

export default async function AuthoritiesPage() {
  const authorities = await listAuthoritiesDirectory();

  return (
    <>
      <script {...jsonLdScriptProps(breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Authorities', path: '/authorities' }]))} />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-primary"><Building2 className="size-4" /> Authorities</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">Who governs the trade.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">{DESCRIPTION}</p>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          {authorities.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-950/40 py-24 text-center">
              <p className="text-sm font-bold text-slate-300">No authorities are published yet.</p>
              <p className="mt-1 text-xs text-slate-500">Reference data is loaded through the import API or the seed tooling.</p>
            </div>
          ) : (
            <AuthorityDirectory authorities={authorities} />
          )}
        </div>
      </section>
    </>
  );
}
