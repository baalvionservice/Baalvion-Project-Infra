import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { COUNTRIES } from '@/lib/mock-data';

type PageProps = { params: { country: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = COUNTRIES[params.country] || COUNTRIES.us;
  return {
    title: `Terms of Service | AMARISÉ MAISON ${country.name}`,
    description: `The terms governing acquisitions, pricing, authenticity, and use of the AMARISÉ MAISON platform in ${country.name}.`,
  };
}

const SECTIONS: { title: string; body: string[] }[] = [
  { title: '1. Acceptance of Terms', body: [
    'By accessing the AMARISÉ MAISON platform or placing an acquisition, you agree to these Terms of Service. If you do not agree, please refrain from using the platform.',
  ] },
  { title: '2. Eligibility', body: [
    'You must be of legal age in your jurisdiction and able to form a binding contract to place an acquisition.',
  ] },
  { title: '3. Acquisitions & Pricing', body: [
    'All prices are displayed in the currency of your selected jurisdiction and are inclusive or exclusive of taxes as indicated at settlement. We reserve the right to correct pricing errors prior to dispatch.',
    'An acquisition is confirmed only upon successful settlement and our acceptance; until then we may decline or cancel an order.',
  ] },
  { title: '4. Authenticity', body: [
    'Every piece is authenticated and ships with a Certificate of Authenticity under our Authenticity Guarantee. See the Authenticity page for details.',
  ] },
  { title: '5. Dispatch, Returns & Settlement', body: [
    'Dispatch is fully insured with signature on delivery. Eligible acquisitions may be returned within the stated window in original condition with provenance documentation intact.',
    'Settlement is processed via our authorized payment partners. Bank transfer acquisitions are dispatched upon cleared funds.',
  ] },
  { title: '6. Intellectual Property', body: [
    'All content, imagery, and marks on the platform are the property of AMARISÉ MAISON or its licensors and may not be reproduced without written permission.',
  ] },
  { title: '7. Limitation of Liability', body: [
    'To the maximum extent permitted by law, AMARISÉ MAISON is not liable for indirect or consequential losses arising from use of the platform. Nothing limits liability that cannot be excluded by law.',
  ] },
  { title: '8. Governing Law', body: [
    'These terms are governed by the laws applicable to your jurisdiction of purchase, without regard to conflict-of-law principles.',
  ] },
  { title: '9. Contact', body: [
    'Questions regarding these terms may be directed to our global concierge via the Contact page.',
  ] },
];

export default function TermsOfServicePage({ params }: PageProps) {
  const countryCode = params.country || 'us';
  const country = COUNTRIES[countryCode] || COUNTRIES.us;

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
          <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum">Terms of Service</span>
        </div>

        <h1 className="text-5xl font-headline font-bold italic tracking-tight mb-3">Terms of Service</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-16">
          Jurisdiction: {country.name} · Last updated {new Date().getFullYear()}
        </p>

        <div className="space-y-12">
          {SECTIONS.map((s) => (
            <section key={s.title} className="space-y-4">
              <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="text-md text-gray-600 font-light leading-relaxed">{p}</p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-16 pt-8 border-t border-border text-sm text-gray-400 font-light italic">
          These terms are provided for transparency and do not constitute legal advice.
        </p>
      </div>
    </div>
  );
}
