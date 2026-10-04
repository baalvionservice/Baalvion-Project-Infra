import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { COUNTRIES } from '@/lib/mock-data';

type PageProps = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = COUNTRIES[(await params).country] || COUNTRIES.us;
  return {
    title: "Shipping & Delivery Policy | AMARISÉ MAISON " + country.name,
    description: "How Amarisé Maison Avenue pieces are packed, insured and delivered.",
  };
}

export default async function ShippingPolicyPage({ params }: PageProps) {
  const countryCode = (await params).country || 'us';
  const country = COUNTRIES[countryCode] || COUNTRIES.us;

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
          <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum">Shipping &amp; Delivery Policy</span>
        </div>

        <h1 className="text-5xl font-headline font-bold italic tracking-tight mb-3">Shipping &amp; Delivery Policy</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
          Storefront: {country.name} · Last updated October 4, 2026
        </p>
        <p className="text-md text-gray-600 font-light leading-relaxed mb-16">How Amarisé Maison Avenue pieces are packed, insured and delivered.</p>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">1. Processing</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Orders are processed within 0 to 1 business days. Made-to-order and personalised pieces carry their own lead time, confirmed at checkout.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">2. Delivery times</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>Domestic delivery: 2 to 5 business days after dispatch within the country of the storefront.</li>
              <li>International delivery: lead times are confirmed at checkout and depend on the destination and customs clearance.</li>
              <li>Delivery estimates start from dispatch, not from the order date.</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">3. Insured carriage</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Every parcel is dispatched fully insured for its replacement value, by courier, with signature required on delivery. Please check the parcel on receipt and tell us within 48 hours if it is damaged.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">4. Shipping charges</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Shipping charges, where any apply, are shown before you pay. Where complimentary shipping is offered it is stated on the product or checkout page.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">5. International orders, duties and taxes</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Duties, import taxes and customs charges are calculated at checkout where possible. If your country charges any amount on arrival, the recipient is responsible for it unless the checkout says it was collected.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">6. Tracking</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">A tracking link is emailed when your order is dispatched and is available under Track Order on this site.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">7. Failed or missed delivery</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">The courier will attempt delivery and contact you. A parcel that cannot be delivered is returned to us; we will contact you to redeliver or refund, less any return carriage that results from an incorrect address.</p>
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
