import type { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: "Shipping & Delivery Policy — Market Underworld Community, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <>
    <main className="min-h-screen bg-[#0B0C0F] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#39FF14]">Legal</p>
        <h1 className="mt-3 text-4xl font-bold uppercase tracking-tight font-display">Shipping &amp; Delivery Policy</h1>
        <p className="mt-3 text-sm text-[#9CA3AF]">How marketplace goods, digital items and memberships reach you.</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#6B7280]">Last updated: October 4, 2026</p>
        <div className="mt-12 space-y-10">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">1. Physical goods</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Independent sellers dispatch their own items. The dispatch time and shipping charge are on each listing and in your order summary before you pay.</li>
              <li>Unless a listing says otherwise, sellers dispatch within 3 business days of payment.</li>
              <li>Delivery times depend on the seller&apos;s location, the destination and the carrier. The estimate shown at checkout is the one that applies.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">2. Digital goods, memberships and classes</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Digital items, gift cards and memberships are delivered electronically to your account or email, normally within a few minutes of payment.</li>
              <li>Live-session and class access appears under your account once payment is confirmed.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">3. Tracking</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">When a seller dispatches an order, tracking details appear in your orders page.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">4. International delivery</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Some sellers ship internationally. Import duties, taxes and customs clearance are the buyer&apos;s responsibility unless the listing says otherwise. We do not support shipment of items that are restricted or prohibited in the destination country.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">5. Late, lost or damaged orders</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">If an order has not arrived by the latest delivery estimate, or arrives damaged, contact support@baalvion.com within 7 days. We will trace it with the seller and either redeliver or refund it.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">Operator</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479, GSTIN 21AANCB3490M1ZF. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
