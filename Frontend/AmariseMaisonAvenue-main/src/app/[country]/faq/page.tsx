import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, HelpCircle } from 'lucide-react';
import { COUNTRIES } from '@/lib/mock-data';

type PageProps = { params: { country: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = COUNTRIES[params.country] || COUNTRIES.us;
  return {
    title: `Frequently Asked Questions | AMARISÉ MAISON ${country.name}`,
    description: `Answers on authentication, sourcing, dispatch, returns, payment and private client services for AMARISÉ MAISON in ${country.name}.`,
  };
}

const SECTIONS: { heading: string; items: { q: string; a: string }[] }[] = [
  {
    heading: 'Authentication & Provenance',
    items: [
      { q: 'Are all artifacts authentic?', a: 'Every piece passes a multi-point authentication by our in-house gemologists and master authenticators before it enters the registry. Each acquisition ships with a numbered Certificate of Authenticity.' },
      { q: 'What happens if an item is found inauthentic?', a: 'In the exceptionally rare event of a verified inauthenticity claim, we offer a full refund and complimentary return logistics under our Authenticity Guarantee.' },
    ],
  },
  {
    heading: 'Dispatch & Logistics',
    items: [
      { q: 'How are pieces shipped?', a: 'All acquisitions are dispatched fully insured via white-glove courier with signature on delivery. Lead times are confirmed at checkout per jurisdiction.' },
      { q: 'Do you ship internationally?', a: 'Yes. Duties and jurisdictional taxes are calculated transparently at settlement based on your delivery charter.' },
    ],
  },
  {
    heading: 'Returns & Settlement',
    items: [
      { q: 'What is the returns window?', a: 'Eligible acquisitions may be returned within 14 days of delivery in original condition with all provenance documentation intact.' },
      { q: 'Which payment methods are accepted?', a: 'We accept major cards via Stripe, Razorpay (India), PayU, and bank transfer / ACH for delayed settlement.' },
    ],
  },
  {
    heading: 'Private Client Services',
    items: [
      { q: 'Can I source a specific piece?', a: 'Yes. Our concierge sourcing service locates pieces not currently in the registry. Submit a private inquiry and a specialist will respond personally.' },
      { q: 'How do I reach a specialist?', a: 'Reach our global concierge through the Contact page or your account dashboard for a private dialogue.' },
    ],
  },
];

export default function FaqPage({ params }: PageProps) {
  const countryCode = params.country || 'us';

  return (
    <div className="animate-fade-in bg-gradient-to-br from-ivory via-white to-ivory min-h-screen">
      <div className="container mx-auto px-6 py-24 max-w-4xl">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
          <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum">FAQ</span>
        </div>

        <div className="flex items-center space-x-4 mb-16">
          <div className="p-4 bg-ivory border border-border rounded-full text-plum"><HelpCircle className="w-7 h-7" /></div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-16">
          {SECTIONS.map((section) => (
            <section key={section.heading} className="space-y-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-plum border-b border-border pb-4">
                {section.heading}
              </h2>
              <dl className="space-y-8">
                {section.items.map((item) => (
                  <div key={item.q} className="space-y-2">
                    <dt className="text-lg font-bold tracking-tight text-gray-900">{item.q}</dt>
                    <dd className="text-md text-gray-500 font-light italic leading-relaxed">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <div className="mt-20 pt-10 border-t border-border text-center">
          <p className="text-md text-gray-500 font-light italic mb-6">Still seeking guidance?</p>
          <Link
            href={`/${countryCode}/contact`}
            className="inline-block bg-black hover:bg-plum text-white rounded-none px-14 h-14 leading-[3.5rem] text-[10px] font-bold uppercase tracking-[0.4em] transition-all shadow-2xl"
          >
            Contact Concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
