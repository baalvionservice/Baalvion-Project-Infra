import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, Fingerprint, FileText, Microscope, type LucideIcon } from 'lucide-react';
import { COUNTRIES, AUTHENTICITY_FALLBACK } from '@/lib/mock-data';
import { getAuthenticityContent } from '@/lib/cms';
import { CertificateVerifier } from '@/components/authenticity/CertificateVerifier';

const STEP_ICON_MAP: Record<string, LucideIcon> = {
  Microscope,
  Fingerprint,
  FileText,
  ShieldCheck,
};

type PageProps = {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ code?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = COUNTRIES[(await params).country] || COUNTRIES.us;
  return {
    title: `Authenticity Guarantee | AMARISÉ MAISON ${country.name}`,
    description: `Every AMARISÉ MAISON acquisition is authenticated by in-house experts and ships with a numbered Certificate of Authenticity. Learn about our guarantee.`,
  };
}

export default async function AuthenticityPage({ params, searchParams }: PageProps) {
  const countryCode = (await params).country || 'us';
  const { code } = await searchParams;
  const content = (await getAuthenticityContent()) ?? AUTHENTICITY_FALLBACK;

  return (
    <div className="animate-fade-in bg-gradient-to-br from-ivory via-white to-ivory min-h-screen">
      <div className="container mx-auto px-6 py-24 max-w-5xl">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
          <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum">Authenticity</span>
        </div>

        <div className="max-w-2xl space-y-4 mb-20">
          <span className="text-plum text-[10px] font-bold tracking-[0.5em] uppercase">{content.eyebrow}</span>
          <h1 className="text-6xl font-headline font-bold italic tracking-tighter">{content.title}</h1>
          <p className="text-xl text-gray-500 font-light italic leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {content.steps.map((s, i) => {
            const Icon = STEP_ICON_MAP[s.icon] || ShieldCheck;
            return (
              <div key={s.title} className="bg-white p-10 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-ivory text-plum rounded-full"><Icon className="w-6 h-6" /></div>
                  <span className="text-4xl font-headline font-bold italic text-gray-200">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900">{s.title}</h2>
                <p className="text-md text-gray-500 font-light italic leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>

        {/* Public certificate verification */}
        <div id="verify" className="mt-20 scroll-mt-24">
          <CertificateVerifier initialCode={code} />
        </div>

        <div className="mt-20 p-12 bg-black text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-headline font-bold italic">{content.ctaTitle}</h3>
            <p className="text-sm text-white/60 font-light italic">{content.ctaSubtitle}</p>
          </div>
          <Link
            href={`/${countryCode}/contact`}
            className="shrink-0 bg-white text-black hover:bg-plum hover:text-white rounded-none px-12 h-14 leading-[3.5rem] text-[10px] font-bold uppercase tracking-[0.4em] transition-all"
          >
            {content.ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
