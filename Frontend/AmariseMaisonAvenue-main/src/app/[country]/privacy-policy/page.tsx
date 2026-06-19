import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { COUNTRIES } from '@/lib/mock-data';
import { getContent, toProse } from '@/lib/cms';

// Fetch CMS content live per request (works on Vercel against the public CMS).
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = COUNTRIES[(await params).country] || COUNTRIES.us;
  return {
    title: `Privacy Policy | AMARISÉ MAISON ${country.name}`,
    description: `How AMARISÉ MAISON collects, uses, and protects your personal data, and the rights available to you in ${country.name}.`,
  };
}

const SECTIONS: { title: string; body: string[] }[] = [
  { title: '1. Information We Collect', body: [
    'We collect information you provide directly — name, contact details, delivery and billing addresses, and acquisition history — when you create an account, place an order, or contact our concierge.',
    'We also collect limited technical data (device, browser, and usage signals) to operate and secure the platform.',
  ] },
  { title: '2. How We Use Your Information', body: [
    'To process and dispatch acquisitions, provide private client services, authenticate identity, prevent fraud, and meet legal and tax obligations in your jurisdiction.',
    'With your consent, to share curated communications about new arrivals and Maison services. You may withdraw consent at any time.',
  ] },
  { title: '3. Sharing & Disclosure', body: [
    'We share data only with processors essential to fulfilment (payment, logistics, identity verification) under contract, and where required by law. We do not sell your personal data.',
  ] },
  { title: '4. Data Retention', body: [
    'We retain personal data only as long as necessary for the purposes described, including legal, accounting, and reporting requirements.',
  ] },
  { title: '5. Your Rights', body: [
    'Subject to your jurisdiction, you may request access, correction, deletion, portability, or restriction of your personal data, and object to certain processing.',
    'To exercise these rights, contact our concierge; we respond within the timeframes required by applicable law.',
  ] },
  { title: '6. Security', body: [
    'We apply administrative, technical, and physical safeguards appropriate to the sensitivity of the data, including encryption in transit and access controls.',
  ] },
  { title: '7. Contact', body: [
    'For privacy inquiries, reach our global concierge through the Contact page or your account dashboard.',
  ] },
];

export default async function PrivacyPolicyPage({ params }: PageProps) {
  const countryCode = (await params).country || 'us';
  const country = COUNTRIES[countryCode] || COUNTRIES.us;

  // CMS-first: render the published legal copy when available, else the static fallback.
  const blocks = toProse(await getContent('privacy-policy'));

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
          <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum">Privacy Policy</span>
        </div>

        <h1 className="text-5xl font-headline font-bold italic tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-16">
          Jurisdiction: {country.name} · Last updated {new Date().getFullYear()}
        </p>

        <div className="space-y-12">
          {blocks.length > 0 ? (
            blocks.map((b, i) =>
              b.type === 'heading' ? (
                <h2 key={i} className="text-lg font-bold uppercase tracking-widest text-gray-900">{b.text}</h2>
              ) : (
                <p key={i} className="text-md text-gray-600 font-light leading-relaxed">{b.text}</p>
              )
            )
          ) : (
            SECTIONS.map((s) => (
              <section key={s.title} className="space-y-4">
                <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">{s.title}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="text-md text-gray-600 font-light leading-relaxed">{p}</p>
                ))}
              </section>
            ))
          )}
        </div>

        <p className="mt-16 pt-8 border-t border-border text-sm text-gray-400 font-light italic">
          This policy is provided for transparency and does not constitute legal advice. Where local law grants
          you greater protections, those protections prevail.
        </p>
      </div>
    </div>
  );
}
