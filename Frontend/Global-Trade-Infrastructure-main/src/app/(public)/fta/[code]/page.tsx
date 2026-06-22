import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Handshake, FileCheck2 } from 'lucide-react';
import { pageMetadata, breadcrumbJsonLd, jsonLdScriptProps } from '@/lib/seo';
import { getAgreementDetail } from '@/server/gckb/public-read';

/**
 * @file (public)/fta/[code]/page.tsx
 * @description Trade-agreement detail — members, rules of origin, duty preference,
 * and every published preferential tariff line granted under the agreement.
 */

export const revalidate = 300;

type Params = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const detail = await getAgreementDetail(code);
  if (!detail) {
    return pageMetadata({ title: 'Agreement not found', description: 'This trade agreement is not published.', path: `/fta/${code}`, noindex: true });
  }
  const name = detail.agreement.name;
  return pageMetadata({
    title: `${name} — Rules of Origin & Duty Preference`,
    description: `Members, rules of origin, duty preference and preferential tariff lines under ${name}.`,
    path: `/fta/${detail.agreement.recordKey.toLowerCase()}`,
    keywords: [`${name} rules of origin`, `${name} members`, 'preferential tariff', 'duty preference', 'free trade agreement'],
  });
}

export default async function FtaDetailPage({ params }: Params) {
  const { code } = await params;
  const detail = await getAgreementDetail(code);
  if (!detail) notFound();

  const { agreement, members, preferentialTariffs } = detail;

  return (
    <>
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Trade Agreements', path: '/fta' },
            { name: agreement.name, path: `/fta/${agreement.recordKey.toLowerCase()}` },
          ]),
        )}
      />

      <section className="border-b border-white/5 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <Link href="/fta" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 transition hover:text-primary">
            <ArrowLeft className="size-3.5" /> All agreements
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Handshake className="size-6" />
            </span>
            <div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">{agreement.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {agreement.kind ? <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">{agreement.kind}</span> : null}
                {agreement.status ? <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">{agreement.status}</span> : null}
                {agreement.inForceSince ? <span className="text-[11px] text-slate-500">In force since {agreement.inForceSince}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-7xl space-y-12 px-6 py-14">
          {/* Rules of origin / duty preference */}
          {(agreement.rulesOfOriginSummary || agreement.dutyPreferenceNote) ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {agreement.rulesOfOriginSummary ? (
                <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-primary">Rules of Origin</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{agreement.rulesOfOriginSummary}</p>
                </div>
              ) : null}
              {agreement.dutyPreferenceNote ? (
                <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-primary">Duty Preference</h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{agreement.dutyPreferenceNote}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Members */}
          <section>
            <h2 className="mb-4 text-lg font-black text-white">Member countries <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-black text-slate-400">{agreement.memberCountryCodes.length}</span></h2>
            {members.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <Link key={m.code} href={`/countries/${m.code.toLowerCase()}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-primary/50 hover:text-primary">
                    <span aria-hidden>{m.flagEmoji ?? '🏳️'}</span> {m.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="flex flex-wrap gap-2">
                {agreement.memberCountryCodes.map((m) => (
                  <span key={m} className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1.5 font-mono text-xs font-bold text-slate-400">{m}</span>
                ))}
              </p>
            )}
          </section>

          {/* Preferential tariff lines */}
          <section>
            <h2 className="mb-4 flex items-center gap-3 text-lg font-black text-white">
              <FileCheck2 className="size-5 text-primary" /> Preferential tariff lines
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-black text-slate-400">{preferentialTariffs.length}</span>
            </h2>
            {preferentialTariffs.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-sm text-slate-500">
                No preferential tariff lines are published under this agreement yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-2.5">Country</th>
                      <th className="px-4 py-2.5">Tariff line</th>
                      <th className="px-4 py-2.5">HS</th>
                      <th className="px-4 py-2.5 text-right">Preferential rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {preferentialTariffs.map((t) => (
                      <tr key={t.recordKey}>
                        <td className="px-4 py-2.5 font-bold text-white">
                          {t.countryCode !== '—' ? (
                            <Link href={`/countries/${t.countryCode.toLowerCase()}`} className="hover:text-primary">{t.countryName}</Link>
                          ) : t.countryName}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">{t.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{t.hsCode ?? '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-300">{t.ratePercent !== null ? `${t.ratePercent}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </>
  );
}
