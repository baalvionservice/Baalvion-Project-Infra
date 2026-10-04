import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { COUNTRIES } from '@/lib/mock-data';

type PageProps = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = COUNTRIES[(await params).country] || COUNTRIES.us;
  return {
    title: "Refund & Cancellation Policy | AMARISÉ MAISON " + country.name,
    description: "Returns, exchanges, cancellations and refunds for Amarisé Maison Avenue orders.",
  };
}

export default async function RefundPolicyPage({ params }: PageProps) {
  const countryCode = (await params).country || 'us';
  const country = COUNTRIES[countryCode] || COUNTRIES.us;

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
          <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum">Refund &amp; Cancellation Policy</span>
        </div>

        <h1 className="text-5xl font-headline font-bold italic tracking-tight mb-3">Refund &amp; Cancellation Policy</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
          Storefront: {country.name} · Last updated October 4, 2026
        </p>
        <p className="text-md text-gray-600 font-light leading-relaxed mb-16">Returns, exchanges, cancellations and refunds for Amarisé Maison Avenue orders.</p>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">1. Cancelling an order</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>You can cancel before the order is dispatched. Write to support@baalvion.com with your order number; if it has not left our atelier, we cancel it and refund in full.</li>
              <li>Once an order has been dispatched, cancellation is no longer possible and the return process below applies.</li>
              <li>Made-to-order, engraved or personalised pieces cannot be cancelled once production has begun.</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">2. Returns</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>Eligible pieces may be returned within 7 to 15 days of delivery, as stated for your country on the Customer Service page.</li>
              <li>The piece must be unworn, unused, in original condition and packaging, with all tags, certificates and provenance documents.</li>
              <li>Returns are accepted by insured post or courier only. Use the prepaid return label supplied in your parcel where one is provided.</li>
              <li>Return shipping is free within the country of delivery. For international returns the cost is stated on the return authorisation.</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">3. Exchanges</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Exchanges are offered subject to stock and to inspection of the returned piece.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">4. Inspection</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Every returned piece is inspected by our specialists for condition, authenticity and compliance with these terms. We tell you the outcome by email.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">5. Authenticity claims</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">If a piece is verified as not authentic, we refund the full price, including the original shipping charge, and arrange collection at our cost.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">6. Damaged or incorrect items</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Photograph the parcel and the piece and write to support@baalvion.com within 48 hours of delivery. We arrange collection and either replace the piece or refund it, at your choice, subject to availability.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">7. Items that cannot be returned</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>Personalised, engraved or made-to-order pieces</li>
              <li>Pieces returned worn, altered, damaged by the customer, or without certificates and tags</li>
              <li>Gift cards and digital services once delivered</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">8. Refunds</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Approved refunds are issued within 5 business days after we receive and inspect the piece, to the original payment method. Your bank may take a further 5 to 10 business days to show it.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">Operator</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479, GSTIN 21AANCB3490M1ZF. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
